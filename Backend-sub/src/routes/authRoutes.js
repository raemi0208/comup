/* 
□ authRoutes.js: 회원가입, 로그인 페이지 라우팅
*/

// 회원가입과 로그인을 처리할 주소

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // 회원가입
router.post('/login', authController.login);       // 로그인

module.exports = router;