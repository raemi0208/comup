/**
 * @file KickedMember.js
 * @description 위치 공유 방에서 강퇴된 사용자 이력을 관리하는 Sequelize 모델입니다.
 * 특정 방(roomId)에 강퇴당한 사용자(userId)의 재입장을 차단하는 블랙리스트 검증 로직의 기준 데이터로 활용됩니다.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * @swagger
 * components:
 * schemas:
 * KickedMember:
 * type: object
 * required:
 * - roomId
 * - userId
 * properties:
 * id:
 * type: integer
 * description: 강퇴 기록 고유 식별자 (자동 증가)
 * example: 1
 * roomId:
 * type: integer
 * description: 강퇴 처리가 발생한 대상 방의 고유 식별 ID
 * example: 104
 * userId:
 * type: integer
 * description: 해당 방에서 퇴출당한 유저의 고유 식별 ID
 * example: 28
 * kickedAt:
 * type: string
 * format: date-time
 * description: 강퇴 처리가 수행된 일시
 * example: "2026-06-20T17:19:25.000Z"
 */
const KickedMember = sequelize.define('KickedMember', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: 'room_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    kickedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'kicked_at' }
}, {
    tableName: 'kicked_members',
    timestamps: false,
    // 특정 방에 동일 유저가 중복으로 강퇴 등록되는 것을 방지하고 조회 성능을 최적화하기 위한 복합 유니크 인덱스 설정
    indexes: [{ unique: true, fields: ['room_id', 'user_id'] }]
});

module.exports = KickedMember;