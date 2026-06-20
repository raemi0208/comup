/**
 * @file CommentController.js
 * @description 특정 게시글에 종속된 댓글의 조회, 작성, 삭제(CRUD)를 처리하는 컨트롤러입니다.
 * 댓글 작성 및 삭제 시 인증된 사용자(req.userId) 정보를 기반으로 권한 검증을 수행합니다.
 */

const { Comment, User, Post } = require('../models');

/**
 * 특정 게시글의 댓글 목록 조회
 * @route GET /api/posts/:postId/comments
 */
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // 해당 게시글의 모든 댓글을 작성자 닉네임과 함께 생성일 오름차순으로 조회
    const comments = await Comment.findAll({
      where: { postId },
      include: [{ model: User, attributes: ['nickname'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(comments);
  } catch (error) {
    console.error('getComments 오류:', error);
    res.status(500).json({ error: '댓글을 불러오지 못했습니다.' });
  }
};

/**
 * 특정 게시글에 새로운 댓글 작성
 * @route POST /api/posts/:postId/comments
 */
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    // 유효성 검사: 댓글 내용이 비어있거나 공백만 있는 경우 예외 처리
    if (!content?.trim()) {
      return res.status(400).json({ error: '댓글 내용을 입력해 주세요.' });
    }
    
    // 대상 게시글 존재 여부 확인
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    // 댓글 데이터베이스 레코드 생성
    const comment = await Comment.create({
      content,
      postId,
      userId: req.userId
    });

    // 프론트엔드 렌더링 편의를 위해 작성자 닉네임 정보를 포함(Join)하여 재조회 후 응답
    const withUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['nickname'] }]
    });
    res.status(201).json(withUser);
  } catch (error) {
    console.error('createComment 오류:', error);
    res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
  }
};

/**
 * 특정 댓글 삭제
 * @route DELETE /api/comments/:commentId
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // 대상 댓글 존재 여부 확인
    const comment = await Comment.findByPk(commentId);
    if (!comment) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    
    // 소유권 확인: 요청한 사용자와 댓글 작성자가 일치하는지 검증
    if (comment.userId !== req.userId) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    // 댓글 레코드 삭제 수행
    await comment.destroy();
    res.json({ message: '댓글 삭제 완료' });
  } catch (error) {
    console.error('deleteComment 오류:', error);
    res.status(500).json({ error: '댓글 삭제 실패' });
  }
};

module.exports = { getComments, createComment, deleteComment };