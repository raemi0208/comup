const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// 1. 방 생성 (임시 코드 발급)
router.post('/create', roomController.createRoom);

// 2. 방 입장 (임시 코드 입력)
router.post('/join', roomController.joinRoom);

// 3. 내 실시간 위치 업데이트 (주기적 전송)
router.post('/location', roomController.updateLocation);

module.exports = router;