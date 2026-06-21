/**
 * @file postRoutes.js
 * @description 커뮤니티 게시글(Post), 좋아요 상호작용(Like), 조회수 트래킹(View), 그리고 독립 댓글(Comment) 자원의 
 * 통합 연동 및 라이프사이클 관리를 위한 핵심 라우팅 레이어입니다.
 */

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/CommentController');
const authMiddleware = require('../middlewares/authMiddleware');

// ==========================================
// 1. 게시글 관련 엔드포인트 (Post Lifecycle)
// ==========================================

// 전체 게시글 컬렉션 조회 (필터링 및 검색 쿼리 수용)
router.get('/', postController.getPosts);

// 신규 게시글 자원 생성 (인증 필수)
router.post('/', authMiddleware, postController.createPost);

// 특정 식별 자원(postId)의 게시글 콘텐츠 수정 (인증 및 자원 소유권 검증 필요)
router.patch('/:postId', authMiddleware, postController.updatePost);

// 특정 식별 자원(postId)의 게시글 영구 삭제 (인증 및 자원 소유권 검증 필요)
router.delete('/:postId', authMiddleware, postController.deletePost);

// ==========================================
// 2. 메트릭스 및 상호작용 (Views & Likes)
// ==========================================

// 특정 게시글의 고유 조회수 조건부 증가 (비인증/인증 사용자 공통 수용)
router.patch('/:postId/views', postController.incrementViews);

// 특정 게시글에 대한 사용자의 추천/좋아요 활성화 상태 반전 토글 (인증 필수)
router.patch('/:postId/like', authMiddleware, postController.toggleLike);

// ==========================================
// 3. 하위 댓글 도메인 관련 엔드포인트 (Sub-Comments)
// ==========================================

// 특정 게시글(postId)에 종속된 전체 댓글 목록 연관 조회
router.get('/:postId/comments', commentController.getComments);

// 특정 게시글(postId) 하위에 신규 댓글 리소스 등록 (인증 필수)
router.post('/:postId/comments', authMiddleware, commentController.createComment);

// 특정 게시글 컨텍스트 내의 특정 댓글 식별 자원(commentId) 영구 삭제 (인증 및 소유권 검증 필요)
router.delete('/:postId/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;
