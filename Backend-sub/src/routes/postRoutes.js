/* 
□ postRoutes.js: POST 목록, 쓰기, 삭제 라우팅
*/

// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController'); // 컨트롤러에서 만든 함수
const authMiddleware = require('../middlewares/authMiddleware'); // 미들웨어

// [1] 글 목록 가져오기 (누구나 가능)
router.get('/', postController.getPosts);

// [2] 글 쓰기 (로그인한 사람만 가능 - authMiddleware 거침)
router.post('/', authMiddleware, postController.createPost);

// [3] 글 삭제 (로그인한 사람만 가능 - authMiddleware 거침)
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;