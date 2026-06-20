/**
 * @file roomController.js
 * @description 실시간 위치 공유 방의 생성, 입장, 멤버 관리, 위치 갱신 및 퇴장 로직을 처리하는 컨트롤러입니다.
 * PostgreSQL 데이터 타입 호환성과 중복 방지 처리를 고려하여 안정성을 높였습니다.
 */

const crypto = require('crypto');
const { Room, RoomMember, Location: UserLocation } = require('../models');
const KickedMember = require('../models/Kickedmember');
const { Op } = require('sequelize');

/**
 * 새로운 위치 공유 방 생성
 * 방을 생성한 사용자가 자동으로 방장(hostUserId)으로 지정됩니다.
 * @route POST /api/rooms
 */
exports.createRoom = async (req, res) => {
    let { roomName, userId, userName } = req.body; 

    if (!userId || !userName) {
        return res.status(400).json({ success: false, message: "userId, userName은 필수입니다." });
    }

    try {
        // PostgreSQL 데이터 무결성 검증을 위한 문자열 강제 형변환
        userId = String(userId);

        // 6자리 대문자 고유 방 코드 생성
        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // 방 유효기간 설정 (생성 시점으로부터 24시간)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 방 레코드 생성
        const newRoom = await Room.create({ roomCode, roomName, hostUserId: userId, expiresAt });

        // 생성자를 첫 번째 멤버로 등록
        await RoomMember.create({ roomId: newRoom.id, userId, userName });

        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 초대 코드를 통한 방 입장
 * @route POST /api/rooms/join
 */
exports.joinRoom = async (req, res) => {
    let { roomCode, userId, userName } = req.body; 

    if (!roomCode || !userId || !userName) {
        return res.status(400).json({ success: false, message: "roomCode, userId, userName은 필수입니다." });
    }

    try {
        userId = String(userId);

        // 유효한 코드이며 만료되지 않은 방 검색
        const room = await Room.findOne({
            where: {
                roomCode: roomCode.toUpperCase(),
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "유효하지 않거나 만료된 코드입니다." });
        }

        // 강퇴 이력 테이블을 조회하여 재입장 차단
        const kicked = await KickedMember.findOne({ where: { roomId: room.id, userId } });
        if (kicked) {
            return res.status(403).json({ success: false, message: "이 방에서 강퇴되어 다시 입장할 수 없습니다." });
        }

        // DB 락 및 무결성 에러 예방을 위해 upsert 대신 단일 조회 후 분기 처리
        const existingMember = await RoomMember.findOne({
            where: { roomId: room.id, userId }
        });

        if (!existingMember) {
            // 신규 입장 멤버 등록
            await RoomMember.create({ roomId: room.id, userId, userName });
        } else {
            // 기존 멤버의 세션 및 닉네임 최신화
            existingMember.userName = userName;
            await existingMember.save();
        }

        res.status(200).json({
            success: true,
            data: {
                roomId: room.id,
                roomName: room.roomName,
                roomCode: room.roomCode, // 프론트엔드 상시 노출용 코드 반환
                hostUserId: room.hostUserId
            }
        });
    } catch (error) {
        console.error("❌ joinRoom 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 내가 참여 중인 방 복구 조회
 * 새로고침이나 세션 끊김 시 로컬 스토리지 정보를 기반으로 상태 복구에 활용됩니다.
 * @route GET /api/rooms/:roomId/my
 */
exports.getMyRoom = async (req, res) => {
    const { roomId } = req.params;
    let { userId } = req.query;

    if (!roomId || !userId) {
        return res.status(400).json({ success: false, message: "roomId, userId가 필요합니다." });
    }

    try {
        userId = String(userId);

        const room = await Room.findOne({
            where: {
                id: roomId,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!room) {
            return res.status(404).json({ success: false, message: "방이 존재하지 않거나 만료되었습니다." });
        }

        const kicked = await KickedMember.findOne({ where: { roomId: room.id, userId } });
        if (kicked) {
            return res.status(403).json({ success: false, message: "이 방에서 강퇴되어 다시 입장할 수 없습니다." });
        }

        const member = await RoomMember.findOne({ where: { roomId: room.id, userId } });
        if (!member) {
            return res.status(404).json({ success: false, message: "해당 방의 멤버가 아닙니다." });
        }

        res.status(200).json({
            success: true,
            data: {
                roomId: room.id,
                roomName: room.roomName,
                roomCode: room.roomCode,
                hostUserId: room.hostUserId
            }
        });
    } catch (error) {
        console.error("❌ getMyRoom 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 멤버의 현재 위치 실시간 동기화 및 업데이트
 * @route PUT /api/rooms/location
 */
exports.updateLocation = async (req, res) => {
    let { userId, roomId, latitude, longitude } = req.body; 

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
        userId = String(userId);

        const isMember = await RoomMember.findOne({ where: { roomId, userId } });
        if (!isMember) {
            return res.status(403).json({ success: false, message: "해당 방의 멤버가 아닙니다." });
        }

        // 유니크 키 충돌 이슈 방지를 위해 findOne 분기 컴포지션 적용
        const existingLocation = await UserLocation.findOne({
            where: { roomId, userId }
        });

        if (!existingLocation) {
            await UserLocation.create({
                userId, roomId, latitude: lat, longitude: lon, updatedAt: new Date()
            });
        } else {
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

/**
 * 방에 소속된 전체 멤버의 최신 위치 및 식별 정보 취합 조회
 * @route GET /api/rooms/:roomId/locations
 */
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

        const members = await RoomMember.findAll({
            where: { roomId },
            attributes: ["userId", "userName"]
        });

        const locations = await UserLocation.findAll({
            where: { roomId }
        });

        // O(N) 탐색 최적화를 위해 위치 데이터를 해시 맵 구조로 매핑
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

/**
 * 방 멤버 간단 목록 조회 (강퇴 관리 모달 등 컴팩트 UI 컴포넌트용)
 * @route GET /api/rooms/:roomId/members
 */
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

        // 스키마 명세에 맞추어 컬럼 정렬 기준을 실제 필드인 createdAt으로 처리
        const members = await RoomMember.findAll({
            where: { roomId },
            attributes: ["userId", "userName", "createdAt"],
            order: [["createdAt", "ASC"]]
        });

        res.status(200).json({
            success: true,
            data: members,
            hostUserId: room.hostUserId,
            roomCode: room.roomCode,
            roomName: room.roomName
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 특정 멤버 강퇴 처리 (방장 고유 권한)
 * @route POST /api/rooms/:roomId/kick
 */
exports.kickMember = async (req, res) => {
    const { roomId } = req.params;
    let { requesterId, targetUserId } = req.body; 

    if (!roomId || !requesterId || !targetUserId) {
        return res.status(400).json({ success: false, message: "roomId, requesterId, targetUserId는 필수입니다." });
    }

    try {
        requesterId = String(requesterId);
        targetUserId = String(targetUserId);

        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "존재하지 않는 방입니다." });
        }

        if (String(room.hostUserId) !== requesterId) {
            return res.status(403).json({ success: false, message: "방장만 멤버를 강퇴할 수 있습니다." });
        }

        if (requesterId === targetUserId) {
            return res.status(400).json({ success: false, message: "방장은 스스로를 강퇴할 수 없습니다." });
        }

        const target = await RoomMember.findOne({ where: { roomId, userId: targetUserId } });
        if (!target) {
            return res.status(404).json({ success: false, message: "해당 멤버를 찾을 수 없습니다." });
        }

        // 실시간 캐시 및 히스토리 테이블에서 관계 데이터 삭제
        await RoomMember.destroy({ where: { roomId, userId: targetUserId } });
        await UserLocation.destroy({ where: { roomId, userId: targetUserId } });

        // 동일 코드를 통한 악의적 재입장 방지를 위해 강퇴 블랙리스트 등록
        await KickedMember.upsert({ roomId, userId: targetUserId });

        res.status(200).json({ success: true, message: "멤버를 강퇴했습니다." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 방 나가기 (자발적 퇴장 기능)
 * 방장이 퇴장하는 경우 연쇄 데이터 파괴를 수반하여 방을 폭파하며, 일반 유저는 본인 세션만 제거합니다.
 * @route POST /api/rooms/:roomId/leave
 */
exports.leaveRoom = async (req, res) => {
    const { roomId } = req.params;
    let { userId } = req.body;

    if (!roomId || !userId) {
        return res.status(400).json({ success: false, message: "roomId, userId가 필요합니다." });
    }

    try {
        userId = String(userId);

        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(200).json({ success: true, message: "이미 종료된 방입니다." });
        }

        const isHost = String(room.hostUserId) === userId;

        if (isHost) {
            // 방장 퇴장 시 종속된 모든 엔티티 데이터 무결성 초기화 및 방 폭파 처리
            await RoomMember.destroy({ where: { roomId } });
            await UserLocation.destroy({ where: { roomId } });
            await KickedMember.destroy({ where: { roomId } });
            await room.destroy();
            return res.status(200).json({ success: true, message: "방장이 나가 방이 종료되었습니다.", roomClosed: true });
        }

        // 일반 유저 퇴장 시 개인 이력 레코드만 제거
        await RoomMember.destroy({ where: { roomId, userId } });
        await UserLocation.destroy({ where: { roomId, userId } });

        res.status(200).json({ success: true, message: "방에서 나갔습니다.", roomClosed: false });
    } catch (error) {
        console.error("❌ leaveRoom 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};