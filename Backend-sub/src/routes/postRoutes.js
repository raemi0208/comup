/* 
□ postRoutes.js: POST 목록, 쓰기, 삭제 라우팅
*/

// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController'); // 컨트롤러에서 만든 함수
const authMiddleware = require('../middlewares/authMiddleware'); // 미들웨어

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 게시물 가져오기 (누구나 가능)
 *     description: 커뮤니티에 올라온 전체 게시물 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 게시물 조회 성공
 */
// [1] 글 목록 가져오기 (누구나 가능)
router.get('/', postController.getPosts);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 게시물 쓰기 (로그인 필수)
 *     description: 로그인한 사용자만 새로운 게시물을 작성할 수 있습니다.
 *     responses:
 *       201:
 *         description: 게시물 작성 성공
 *       401:
 *         description: 인증 실패 (로그인 필요)
 */
// [2] 글 쓰기 (로그인한 사람만 가능 - authMiddleware 거침)
router.post('/', authMiddleware, postController.createPost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: 게시물 삭제 (로그인 필수)
 *     description: 로그인한 사용자만 자신의 게시물을 삭제할 수 있습니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 * description: 삭제할 게시물의 고유 ID 번호
 *     responses:
 *       200:
 *         description: 게시물 삭제 성공
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *       404:
 *         description: 해당 게시물을 찾을 수 없음
 */
// [3] 글 삭제 (로그인한 사람만 가능 - authMiddleware 거침)
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;