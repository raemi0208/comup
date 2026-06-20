/*
□ authRoutes.js: 회원가입, 로그인, 토큰 검증 페이지 라우팅
*/

// 회원가입과 로그인을 처리할 주소

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); // [추가]

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

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: 토큰 유효성 검증
 *     description: 가지고 있는 토큰이 아직 유효한지(+ 서버가 재시작되지 않았는지) 확인합니다.
 *     responses:
 *       200:
 *         description: 유효한 토큰
 *       401:
 *         description: 토큰이 없거나, 만료/무효하거나, 서버가 재시작됨
 */
router.get('/verify', authMiddleware, authController.verify); // [추가] 토큰 검증

module.exports = router;