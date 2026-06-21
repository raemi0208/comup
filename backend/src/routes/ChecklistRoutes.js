/**
 * @file checklistRoutes.js
 * @description 사용자 개인별 체크리스트(준비물, 수행 과제 등) 항목의 통합 CRUD 관리를 위한 라우팅 레이어입니다.
 * 모든 엔드포인트는 인증 미들웨어(authMiddleware)를 경유하며, 디코딩된 세션 컨텍스트(req.userId)에 종속된 소유 자원만 제어하도록 원천 격리되어 있습니다.
 */

const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/ChecklistController');
const authMiddleware = require('../middlewares/authMiddleware');

// 인증된 사용자의 고유 체크리스트 전체 조회
router.get('/', authMiddleware, checklistController.getChecklist);

// 세션 사용자 도메인 내 신규 체크리스트 항목 추가
router.post('/', authMiddleware, checklistController.addItem);

// 경로 식별자(itemId)로 지정된 특정 항목의 완료 여부 상태 반전(토글)
router.patch('/:itemId/toggle', authMiddleware, checklistController.toggleItem);

// 자원 식별자(itemId)에 해당하는 체크리스트 항목 영구 삭제
router.delete('/:itemId', authMiddleware, checklistController.deleteItem);

module.exports = router;
