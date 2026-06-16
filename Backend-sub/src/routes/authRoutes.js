/* 
□ authRoutes.js: 회원가입, 로그인 페이지 라우팅
*/

// 회원가입과 로그인을 처리할 주소

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 잘못된 요청
 */

router.post('/register', authController.register); // 회원가입

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 기존 사용자가 로그인하여 토큰을 발급받습니다.
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패 (비밀번호 틀림 등)
 */
router.post('/login', authController.login);       // 로그인

module.exports = router;