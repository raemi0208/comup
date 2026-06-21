/**
 * @file mypageRoutes.js
 * @description 사용자 프로필 관리, 확장 정보 수정 및 아바타 이미지 업데이트를 위한 마이페이지 API 라우팅 레이어입니다.
 * 모든 엔드포인트는 인가 미들웨어(authMiddleware)를 경유하며, 디코딩된 세션 컨텍스트(req.userId)를 기반으로 고유 리소스를 제어합니다.
 */

const express = require('express');
const router = express.Router();
const mypageController = require('../controllers/MypageController');
const authMiddleware = require('../middlewares/authMiddleware');

// 인증 세션 기반의 현재 사용자 프로필 데이터 및 활동 통계(UserStats) 통합 조회
router.get('/', authMiddleware, mypageController.getMyPage);

// 사용자 기본 프로필 정보(닉네임, 한 줄 소개 등) 수정
router.put('/', authMiddleware, mypageController.updateMyPage);

// 프로필 아바타 이미지 리소스 자원 위치(URL) 업데이트
router.put('/avatar', authMiddleware, mypageController.updateAvatar);

module.exports = router;
