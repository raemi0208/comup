const crypto = require('crypto');
const TravelRoom = require('../models/TravelRoom');
const RoomMember = require('../models/RoomMember');
const UserLocation = require('../models/UserLocation');
const { Op } = require('sequelize');

// 1. 방 생성
exports.createRoom = async (req, res) => {
    const { roomName, userId, userName } = req.body;
    try {
        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        
        // 24시간 뒤 만료 시간 설정
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 방 생성
        const newRoom = await TravelRoom.create({ roomCode, roomName, expiresAt });
        
        // 방장을 멤버로 등록
        await RoomMember.create({ roomId: newRoom.id, userId, userName });

        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 2. 방 입장
exports.joinRoom = async (req, res) => {
    const { roomCode, userId, userName } = req.body;
    try {
        // 코드가 일치하고, 만료시간이 현재 시간보다 미래인 방 찾기
        const room = await TravelRoom.findOne({
            where: {
                roomCode: roomCode.toUpperCase(),
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "유효하지 않거나 만료된 코드입니다." });
        }

        // 이미 있는 멤버면 업데이트, 없으면 인서트 (Upsert)
        await RoomMember.upsert({ roomId: room.id, userId, userName });

        res.status(200).json({ success: true, data: { roomId: room.id, roomName: room.roomName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 3. 내 위치 업데이트
exports.updateLocation = async (req, res) => {
    const { userId, roomId, latitude, longitude } = req.body;
    try {
        // 위치 데이터 등록 또는 수정 (Upsert)
        // 이 함수가 실행되어 Supabase DB 값이 바뀌면 Realtime이 프론트엔드로 즉시 알림을 보냅니다.
        await UserLocation.upsert({
            userId, roomId, latitude, longitude, updatedAt: new Date()
        });

        res.status(200).json({ success: true, message: "위치 동기화 성공" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};