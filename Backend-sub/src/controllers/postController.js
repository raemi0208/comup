/*
□ postController.js: POST 관리 (POST 목록 찾기, POST 생성, POST 삭제)
*/

// 커뮤니티 트랜잭션 관리! 
const { Post, Comment, User, sequelize } = require('../models');

// (1) [POST 목록 가져오기] -> (1-1) 모든 POST 찾기 -> (1-2) 포스트 목록 프론트엔드로 전송
const getPosts = async (req, res) => {
  try {
    // (1-1) 모든 POST 찾기
    const posts = await Post.findAll({
      
      // 다른 테이블의 데이터를 합쳐서 가져옵니다 (SQL의 JOIN 기능)
      include: [
        { 
          model: User, 
          attributes: ['nickname'] // 작성자의 '닉네임'만 골라 가져온다. 
        },
        { 
          model: Comment, 
          attributes: ['id'] // 댓글은 일단 ID만 가져온다. (몇 개인지 세는 용도)
        }
      ],
      // 최신글이 위로 오도록 생성일(createdAt) 기준 내림차순(DESC) 정렬합니다.
      order: [['createdAt', 'DESC']] 
    });
    
    // (1-2) 최종 가공된 데이터를 프론트엔드(React)로 전송.
    res.json(posts);  // POST 목록들 응답

  } catch (error) {
    res.status(500).json({ error: "글 목록을 불러오지 못했습니다." });
  }
};

// (2) [POST 작성하기] -> (2-1) 요청 본문 파싱 -> (2-2) 새 POST에 유저 정보 담기 -> (2-3) 새 POST 응답
const createPost = async (req, res) => {
  try {
    // (2-1) 요청 본문의 제목, 내용, 카테고리 파싱
    const { title, content, category } = req.body;
    
    // (2-2) authMiddleware를 거치면 토큰에서 추출한 유저 ID가 req.userId에 담긴다. 
    const newPost = await Post.create({
      title,
      content,
      category,
      userId: req.userId // 로그인한 사람이 누구인지 기록
    });

    // (2-3) 새 POST로 응답
    res.status(201).json(newPost);

  } catch (error) {
    res.status(500).json({ error: "글 작성에 실패했습니다." });
  }
};

// (3) [POST 삭제] -> (3-1) 삭제할 글 ID 가져오기 -> (3-2) 트랜잭션 생성 -> (3-3) 댓글 삭제 -> (3-4) POST 삭제 -> (3-5) 트랜잭션 반영
const deletePost = async (req, res) => {
  // (3-1) URL에서 삭제할 글의 ID를 가져온다. 
  const { postId } = req.params; 
  
  // (3-2) 트랜잭션 객체를 생성
  const t = await sequelize.transaction();

  try {
    // (3-3) (POST ID 이용) 해당 POST에 달려있는 모든 댓글 삭제
    // { transaction: t }를 넣어줌으로써 이 작업이 실패하면 전체를 취소할 준비를 합니다.
    await Comment.destroy({ 
      where: { postId: postId }, 
      transaction: t 
    });

    // (3-4) (POST ID 이용) POST 자체 삭제 
    await Post.destroy({ 
      where: { id: postId }, 
      transaction: t 
    });

    // (3-5) 실제 DB에 반영(Commit)
    await t.commit();
    res.status(200).send("게시글과 모든 댓글이 안전하게 삭제되었습니다.");

  } catch (error) {
    // 만약 위 단계 중 하나라도 에러가 나면 catch문으로.
    // (-) 이때까지 수행한 모든 작업을 취소하고 원래 상태로(Rollback).

    await t.rollback();
    console.error("삭제 실패:", error);
    res.status(500).send("삭제 도중 오류가 발생하여 모든 작업이 취소되었습니다.");
  }
};


module.exports = {
  getPosts,
  createPost,
  deletePost
};