const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Room, RoomMember, Location } = require('../models'); // 프로젝트의 db 객체 경로에 맞추세요.

// 임의의 6자리 영문 대문자/숫자 방 코드 생성기
function generateRoomCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// 1. 방 만들기 [POST] /api/rooms/create
router.post('/create', async (req, res) => {
    const { roomName, userId, userName } = req.body;
    try {
        if (!userId) {
            return res.status(400).json({ success: false, message: "로그인 정보가 필요합니다." });
        }

        // 고유한 방 코드 생성 (중복 방지)
        let roomCode = generateRoomCode();
        let isExist = await Room.findOne({ where: { roomCode } });
        while (isExist) {
            roomCode = generateRoomCode();
            isExist = await Room.findOne({ where: { roomCode } });
        }

        // 방 생성
        const newRoom = await Room.create({
            roomName: roomName || "우리들의 안전 여행 방",
            roomCode,
            hostUserId: userId
        });

        // 방 개설자도 멤버로 추가
        await RoomMember.create({
            roomId: newRoom.id,
            userId,
            userName: userName || "익명"
        });

        return res.status(201).json({
            success: true,
            data: {
                id: newRoom.id,
                roomName: newRoom.roomName,
                roomCode: newRoom.roomCode,
                hostUserId: newRoom.hostUserId
            }
        });
    } catch (error) {
        console.error("방 생성 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류로 방을 생성하지 못했습니다." });
    }
});

// 2. 코드로 입장하기 [POST] /api/rooms/join
router.post('/join', async (req, res) => {
    const { roomCode, userId, userName } = req.body;
    try {
        if (!roomCode || !userId) {
            return res.status(400).json({ success: false, message: "필수 입력 정보가 누락되었습니다." });
        }

        // 코드에 맞는 방 찾기
        const room = await Room.findOne({ where: { roomCode: roomCode.trim().toUpperCase() } });
        if (!room) {
            return res.status(404).json({ success: false, message: "유효하지 않은 참여 코드입니다." });
        }

        // DB 조회 직전에 형변환 추가
        const safeUserId = String(req.body.userId);

        // 이미 참여중인지 확인
        const isMember = await RoomMember.findOne({ where: { roomId: room.id, userId: safeUserId } });
        if (!isMember) {
            // 멤버 테이블에 신규 등록
            await RoomMember.create({
                roomId: room.id,
                userId: safeUserId,
                userName: userName || "익명"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                roomId: room.id,
                roomName: room.roomName,
                hostUserId: room.hostUserId
            }
        });
    } catch (error) {
        console.error("방 입장 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류로 입장하지 못했습니다." });
    }
});

// 3. 방 멤버 목록 조회 [GET] /api/rooms/:roomId/members
router.get('/:roomId/members', async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "방을 찾을 수 없습니다." });
        }

        const members = await RoomMember.findAll({ where: { roomId } });
        return res.status(200).json({
            success: true,
            hostUserId: room.hostUserId,
            data: members // [{ userId, userName }, ...]
        });
    } catch (error) {
        console.error("멤버 조회 오류:", error);
        return res.status(500).json({ success: false, message: "멤버를 조회하는 중 오류가 발생했습니다." });
    }
});

// 4. 멤버 강퇴하기 [POST] /api/rooms/:roomId/kick
router.post('/:roomId/kick', async (req, res) => {
    const { roomId } = req.params;
    const { requesterId, targetUserId } = req.body;
    try {
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "방을 찾을 수 없습니다." });
        }

        // 요청자가 방장인지 권한 체크
        if (String(room.hostUserId) !== String(requesterId)) {
            return res.status(403).json({ success: false, message: "방장만 멤버를 강퇴할 수 있습니다." });
        }

        // 멤버 삭제
        const deleted = await RoomMember.destroy({ where: { roomId, userId: targetUserId } });
        // 위치 정보도 함께 제거
        await Location.destroy({ where: { roomId, userId: targetUserId } });

        if (deleted) {
            return res.status(200).json({ success: true, message: "성공적으로 강퇴되었습니다." });
        } else {
            return res.status(400).json({ success: false, message: "해당 사용자는 방 멤버가 아닙니다." });
        }
    } catch (error) {
        console.error("강퇴 처리 오류:", error);
        return res.status(500).json({ success: false, message: "서ver 오류로 강퇴 처리에 실패했습니다." });
    }
});

// 5. 내 위치 동기화 저장 [POST] /api/rooms/location
router.post('/location', async (req, res) => {
    const { userId, roomId, latitude, longitude } = req.body;
    const safeUserId = String(userId);
    const safeRoomId = String(roomId);
    try {
        if (!safeUserId || !safeRoomId) return res.status(400).json({ success: false });

        // 위치 정보 업데이트 또는 삽입(Upsert)
        await Location.upsert({
            userId: safeUserId,
            roomId: safeRoomId,
            latitude,
            longitude
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("위치 저장 오류:", error);
        return res.status(500).json({ success: false });
    }
});

// 6. 방 멤버 전체 위치 조회 [GET] /api/rooms/:roomId/locations
router.get('/:roomId/locations', async (req, res) => {
    const { roomId } = req.params;
    try {
        // 1. 방에 속한 모든 멤버 가져오기
        const members = await RoomMember.findAll({ where: { roomId } });
        
        // 2. 방에 기록된 위치 데이터들 가져오기
        const locations = await Location.findAll({ where: { roomId } });
        const locationMap = {};
        locations.forEach(loc => {
            locationMap[loc.userId] = loc;
        });

        // 3. 프론트엔드가 원하는 `member.location` 구조로 포맷팅
        const data = members.map(member => {
            const loc = locationMap[member.userId];
            return {
                userId: member.userId,
                userName: member.userName,
                location: loc ? {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    updatedAt: loc.updatedAt
                } : null
            };
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("전체 위치 조회 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

module.exports = router;