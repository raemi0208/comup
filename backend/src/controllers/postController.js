/**
 * @file postController.js
 * @description 게시글의 CRUD 처리와 함께 조회수 중복 방지 파이프라인, 좋아요 토글 로직을 담당하는 컨트롤러입니다.
 * 원자적 연산 및 무결성을 위해 데이터베이스 제약 조건(Unique Constraint)과 트랜잭션을 활용합니다.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');
const { Post, User, Comment, PostLike, PostView, sequelize } = require('../models');

/**
 * 요청 객체(req)에서 클라이언트의 실제 IP 주소를 추출하는 유틸리티
 * 역방향 프록시(Nginx 등) 환경을 고려하여 x-forwarded-for 헤더를 우선적으로 확인합니다.
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

/**
 *Authorization 헤더에서 JWT를 검증하여 유저 ID를 선택적으로 추출하는 유틸리티
 * 조회수 API와 같이 비로그인 유저에게도 개방된 요청에서 회원/비회원을 식별하기 위해 사용됩니다.
 */
const getOptionalUserId = (req) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null; // 토큰이 변조되었거나 만료된 경우 비로그인 상태와 동일하게 취급
  }
};

/**
 * 게시글 목록 조회 (전체 공개)
 * @route GET /api/posts
 */
const getPosts = async (req, res) => {
  try {
    const currentUserId = getOptionalUserId(req); // 로그인 상태인 경우 본인의 좋아요 여부를 판단하기 위해 ID 확보

    const posts = await Post.findAll({
      include: [
        { model: User,    attributes: ['nickname'] },
        { model: Comment, attributes: ['id', 'content', 'createdAt'],
          include: [{ model: User, attributes: ['nickname'] }] },
        { model: PostLike, attributes: ['userId'] }   // 좋아요 여부 및 총개수 계산을 위해 관계 포함
      ],
      order: [['createdAt', 'DESC']]
    });

    // 가상 필드(likes, likedByMe)를 생성하여 프론트엔드가 사용하기 편리한 구조로 매핑
    const result = posts.map((post) => {
      const plain = post.toJSON();
      const likeRows = plain.PostLikes || [];
      return {
        ...plain,
        likes: likeRows.length,
        likedByMe: currentUserId ? likeRows.some((l) => l.userId === currentUserId) : false,
        PostLikes: undefined // 불필요한 원본 관계 배열은 응답에서 제외
      };
    });

    res.json(result);
  } catch (error) {
    console.error('getPosts 오류:', error);
    res.status(500).json({ error: '글 목록을 불러오지 못했습니다.' });
  }
};

/**
 * 게시글 작성
 * @route POST /api/posts
 */
const createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const newPost = await Post.create({
      title,
      content,
      category,
      userId: req.userId
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('createPost 오류:', error);
    res.status(500).json({ error: '글 작성에 실패했습니다.' });
  }
};

/**
 * 게시글 수정 (작성자 본인만 가능)
 * @route PUT /api/posts/:postId
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    
    // 권한 검증: 게시글 소유자와 요청자 ID 일치 여부 확인
    if (post.userId !== req.userId) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    await post.update({
      title: title ?? post.title,
      content: content ?? post.content,
      category: category ?? post.category
    });

    // 수정 완료 후 프론트엔드 화면 동기화를 위해 연관 데이터(작성자, 댓글)를 포함하여 재조회
    const updatedPost = await Post.findByPk(postId, {
      include: [
        { model: User,    attributes: ['nickname'] },
        { model: Comment, attributes: ['id', 'content', 'createdAt'],
          include: [{ model: User, attributes: ['nickname'] }] }
      ]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('updatePost 오류:', error);
    res.status(500).json({ error: '게시글 수정에 실패했습니다.' });
  }
};

/**
 * 게시글 삭제 (작성자 본인만 가능, 연관 데이터 연쇄 삭제를 위한 트랜잭션 적용)
 * @route DELETE /api/posts/:postId
 */
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const t = await sequelize.transaction();
  try {
    const post = await Post.findByPk(postId);
    if (!post) {
      await t.rollback();
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }
    if (post.userId !== req.userId) {
      await t.rollback();
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }
    
    // 외래키 제약 조건을 고려하여 해당 게시글에 종속된 자식 레코드들을 동시 삭제
    await Comment.destroy({ where: { postId }, transaction: t });
    await PostLike.destroy({ where: { postId }, transaction: t });
    await PostView.destroy({ where: { postId }, transaction: t });
    await Post.destroy({ where: { id: postId }, transaction: t });
    
    await t.commit();
    res.status(200).json({ message: '삭제 완료' });
  } catch (error) {
    await t.rollback();
    console.error('deletePost 오류:', error);
    res.status(500).json({ error: '삭제 중 오류가 발생했습니다.' });
  }
};

/**
 * 게시글 조회수 증가 (동일 사용자의 중복 카운트 방지 적용)
 * @route POST /api/posts/:postId/views
 * @description PostView 테이블의 (postId, viewerKey) 복합 유니크 제약을 이용하여 DB 레벨에서 중복 어뷰징을 차단합니다.
 * - 로그인 유저: user:{userId} 구조의 키 발급 (기기/네트워크가 바뀌어도 중복 불가)
 * - 비로그인 유저: ip:{IP주소} 구조의 키 발급 (동일 IP 대역 내 중복 제한)
 */
const incrementViews = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    const userId = getOptionalUserId(req);
    const viewerKey = userId ? `user:${userId}` : `ip:${getClientIp(req)}`;

    try {
      // 새로운 조회 기록 쌍(PostId + ViewerKey)인 경우 레코드 생성 후 카운트 업
      await PostView.create({ postId, viewerKey });
      await post.increment('views');
      await post.reload();
    } catch (err) {
      // 이미 조회한 이력이 있어 유니크 제약 조건 위반 에러가 발생한 경우, 예외를 터뜨리지 않고 현재 조회수만 반환
      if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }

    res.json({ views: post.views });
  } catch (error) {
    console.error('incrementViews 오류:', error);
    res.status(500).json({ error: '조회수 업데이트 실패' });
  }
};

/**
 * 게시글 좋아요 토글 기능 (로그인 필수)
 * @route POST /api/posts/:postId/like
 * @description PostLike 레코드의 존재 유무를 검사하여 있으면 삭제(취소), 없으면 생성(등록) 처리를 수행합니다.
 */
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    const existingLike = await PostLike.findOne({ where: { postId, userId } });

    if (existingLike) {
      // 기존에 좋아요를 누른 상태이므로 레코드 제거 (좋아요 취소)
      await existingLike.destroy();
    } else {
      // 처음 누르는 상태이므로 새 레코드 생성 (좋아요 등록)
      await PostLike.create({ postId, userId });
    }

    // 변경이 반영된 최종 좋아요 총개수를 집계하여 반환
    const likeCount = await PostLike.count({ where: { postId } });
    res.json({ likes: likeCount, liked: !existingLike });
  } catch (error) {
    console.error('toggleLike 오류:', error);
    res.status(500).json({ error: '좋아요 처리 실패' });
  }
};

module.exports = { getPosts, createPost, updatePost, deletePost, incrementViews, toggleLike };