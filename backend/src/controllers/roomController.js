const crypto = require('crypto');
const Room = require('../models/Room'); // 💡 [수정] TravelRoom 대신 Room 모델 불러오기
const RoomMember = require('../models/RoomMember');
const UserLocation = require('../models/UserLocation');
const KickedMember = require('../models/KickedMember');
const { Op } = require('sequelize');

// 1. 방 생성
exports.createRoom = async (req, res) => {
    let { roomName, userId, userName } = req.body; // 💡 안전한 재할당을 위해 let 사용

    if (!userId || !userName) {
        return res.status(400).json({ success: false, message: "userId, userName은 필수입니다." });
    }

    try {
        // 🚨 PostgreSQL 문자열 비교 에러 방지를 위해 강제 형변환
        userId = String(userId);

        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // 24시간 뒤 만료 시간 설정
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 방 생성 (방을 만든 사람 = 방장으로 기록)
        const newRoom = await Room.create({ roomCode, roomName, hostUserId: userId, expiresAt });

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
    let { roomCode, userId, userName } = req.body; // 💡 안전한 재할당을 위해 let 사용

    if (!roomCode || !userId || !userName) {
        return res.status(400).json({ success: false, message: "roomCode, userId, userName은 필수입니다." });
    }

    try {
        // 🚨 PostgreSQL 문자열 비교 에러 방지를 위해 강제 형변환
        userId = String(userId);

        // 코드가 일치하고, 만료시간이 현재 시간보다 미래인 방 찾기
        const room = await Room.findOne({
            where: {
                roomCode: roomCode.toUpperCase(),
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "유효하지 않거나 만료된 코드입니다." });
        }

        // 강퇴당한 유저는 같은 코드로 재입장 불가
        const kicked = await KickedMember.findOne({ where: { roomId: room.id, userId } });
        if (kicked) {
            return res.status(403).json({ success: false, message: "이 방에서 강퇴되어 다시 입장할 수 없습니다." });
        }

        // 💡 [수정] PostgreSQL에서 500 에러를 유발하는 upsert 대신 findOne 후 분기 처리하여 에러 차단
        const existingMember = await RoomMember.findOne({
            where: { roomId: room.id, userId }
        });

        if (!existingMember) {
            // 방에 처음 들어온 유저라면 멤버 등록(Insert)
            await RoomMember.create({ roomId: room.id, userId, userName });
        } else {
            // 이미 방에 있던 유저라면 닉네임만 최신화(Update)
            existingMember.userName = userName;
            await existingMember.save();
        }

        res.status(200).json({
            success: true,
            data: { roomId: room.id, roomName: room.roomName, hostUserId: room.hostUserId }
        });
    } catch (error) {
        console.error("❌ joinRoom 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 3. 내 위치 업데이트
exports.updateLocation = async (req, res) => {
    let { userId, roomId, latitude, longitude } = req.body; // 💡 안전한 재할당을 위해 let 사용

    // 필수값 검증
    if (!userId || !roomId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: "userId, roomId, latitude, longitude는 필수입니다." });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res.status(400).json({ success: false, message: "latitude/longitude가 올바른 숫자가 아닙니다." });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ success: false, message: "latitude/longitude 범위가 올바르지 않습니다." });
    }

    try {
        // 🚨 PostgreSQL 문자열 비교 에러 방지를 위해 강제 형변환
        userId = String(userId);

        // 해당 유저가 실제로 이 방의 멤버인지 확인
        const isMember = await RoomMember.findOne({ where: { roomId, userId } });
        if (!isMember) {
            return res.status(403).json({ success: false, message: "해당 방의 멤버가 아닙니다." });
        }

        // 💡 [수정] 위치 정보 역시 upsert 대신 안전한 findOne 분기 처리로 잠재적 충돌 방지
        const existingLocation = await UserLocation.findOne({
            where: { roomId, userId }
        });

        if (!existingLocation) {
            // 기존 위치 기록이 없으면 새로 생성
            await UserLocation.create({
                userId, roomId, latitude: lat, longitude: lon, updatedAt: new Date()
            });
        } else {
            // 이미 위치 기록이 있으면 좌표와 시간 업데이트
            existingLocation.latitude = lat;
            existingLocation.longitude = lon;
            existingLocation.updatedAt = new Date();
            await existingLocation.save();
        }

        res.status(200).json({ success: true, message: "위치 동기화 성공" });
    } catch (error) {
        console.error("❌ updateLocation 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 4. 방 멤버들의 최신 위치 + 닉네임 한 번에 조회
exports.getRoomLocations = async (req, res) => {
    const { roomId } = req.params;

    if (!roomId) {
        return res.status(400).json({ success: false, message: "roomId가 필요합니다." });
    }

    try {
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "존재하지 않는 방입니다." });
        }

        // 방 멤버 목록 + 각 멤버의 최신 위치를 함께 조회
        const members = await RoomMember.findAll({
            where: { roomId },
            attributes: ["userId", "userName"]
        });

        const locations = await UserLocation.findAll({
            where: { roomId }
        });

        // userId 기준으로 위치 정보를 매핑
        const locationMap = {};
        locations.forEach((loc) => {
            locationMap[loc.userId] = {
                latitude: loc.latitude,
                longitude: loc.longitude,
                updatedAt: loc.updatedAt
            };
        });

        const data = members.map((member) => ({
            userId: member.userId,
            userName: member.userName,
            location: locationMap[member.userId] || null
        }));

        res.status(200).json({ success: true, data, hostUserId: room.hostUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 5. 방 멤버 목록만 조회 (강퇴 모달 등 가벼운 멤버 리스트 UI용)
exports.getRoomMembers = async (req, res) => {
    const { roomId } = req.params;

    if (!roomId) {
        return res.status(400).json({ success: false, message: "roomId가 필요합니다." });
    }

    try {
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "존재하지 않는 방입니다." });
        }

        const members = await RoomMember.findAll({
            where: { roomId },
            attributes: ["userId", "userName", "joinedAt"],
            order: [["joinedAt", "ASC"]]
        });

        res.status(200).json({ success: true, data: members, hostUserId: room.hostUserId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// 6. 멤버 강퇴 (방장만 가능)
exports.kickMember = async (req, res) => {
    const { roomId } = req.params;
    let { requesterId, targetUserId } = req.body; // 💡 안전한 재할당을 위해 let 사용

    if (!roomId || !requesterId || !targetUserId) {
        return res.status(400).json({ success: false, message: "roomId, requesterId, targetUserId는 필수입니다." });
    }

    try {
        // 🚨 PostgreSQL 문자열 비교 에러 방지를 위해 강제 형변환
        requesterId = String(requesterId);
        targetUserId = String(targetUserId);

        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "존재하지 않는 방입니다." });
        }

        // 방장 본인만 강퇴를 실행할 수 있음
        if (String(room.hostUserId) !== requesterId) {
            return res.status(403).json({ success: false, message: "방장만 멤버를 강퇴할 수 있습니다." });
        }

        // 방장은 스스로 강퇴할 수 없음
        if (requesterId === targetUserId) {
            return res.status(400).json({ success: false, message: "방장은 스스로를 강퇴할 수 없습니다." });
        }

        const target = await RoomMember.findOne({ where: { roomId, userId: targetUserId } });
        if (!target) {
            return res.status(404).json({ success: false, message: "해당 멤버를 찾을 수 없습니다." });
        }

        // 멤버 목록과 위치 기록에서 제거
        await RoomMember.destroy({ where: { roomId, userId: targetUserId } });
        await UserLocation.destroy({ where: { roomId, userId: targetUserId } });

        // 같은 코드로 재입장하지 못하도록 강퇴 기록 남김
        await KickedMember.upsert({ roomId, userId: targetUserId });

        res.status(200).json({ success: true, message: "멤버를 강퇴했습니다." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};