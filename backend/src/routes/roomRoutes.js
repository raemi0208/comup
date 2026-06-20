/**
 * @file roomRoutes.js
 * @description 실시간 위치 공유 방(Room) 생성, 그룹 멤버 관리(입장/퇴장/강퇴) 및 
 * 참가자 간 GPS 위경도 좌표 데이터 동기화를 처리하는 핵심 라우팅 레이어입니다.
 */

const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// ==========================================
// 1. 방 세션 생명주기 관리 (Room Session Lifecycle)
// ==========================================

// 고유 참여 코드를 동반한 실시간 위치 공유 방 개설
router.post('/create', roomController.createRoom);

// 발급된 6자리 고유 참여 코드를 통한 기존 방 세션 입장
router.post('/join', roomController.joinRoom);

// 클라이언트 측 비연결 상태(새로고침, 탭 이동, 브라우저 재진입 등) 발생 시 로컬 스토리지를 참조한 세션 및 참여 권한 복구 조회
router.get('/:roomId/me', roomController.getMyRoom);


// ==========================================
// 2. 방 멤버십 제어 관리 (Membership Management)
// ==========================================

// 현재 지정된 방(roomId)에 속한 전체 참여 멤버 컬렉션 조회
router.get('/:roomId/members', roomController.getRoomMembers);

// 방을 개설한 호스트 권한으로 특정 멤버를 세션에서 강제 퇴장(KICK) 처리
router.post('/:roomId/kick', roomController.kickMember);

// 참여 중인 사용자가 스스로 해당 위치 공유 방 세션을 이탈(LEAVE) 처리
router.post('/:roomId/leave', roomController.leaveRoom);


// ==========================================
// 3. 실시간 위치 인텔리전스 동기화 (Location Telemetry Sync)
// ==========================================

// 클라이언트 디바이스에서 수신한 최신 GPS 위경도 좌표의 실시간 오버라이트 저장 및 갱신
router.post('/location', roomController.updateLocation);

// 특정 방(roomId)에 동시 접속 중인 모든 멤버의 실시간 위치 스냅샷 데이터 전체 조회
router.get('/:roomId/locations', roomController.getRoomLocations);

module.exports = router;