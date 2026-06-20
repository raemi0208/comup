/**
 * @file RoomMember.js
 * @description 특정 실시간 위치 공유 방(Room)에 참여 중인 소속 그룹 멤버들의 정보를 관리하는 교차 참조 모델입니다.
 * 방 엔티티(roomId)와 사용자 세션 정보(userId, userName)를 매핑하여 실시간 동기화 대상 팩터를 정의합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * RoomMember:
 * type: object
 * required:
 * - roomId
 * - userId
 * - userName
 * properties:
 * id:
 * type: integer
 * description: 방 멤버 관계 레코드 고유 식별자 (자동 증가)
 * example: 1
 * roomId:
 * type: integer
 * description: 사용자가 참여 중인 대상 위치 공유 방의 고유 식별 ID (외래키)
 * example: 104
 * userId:
 * type: string
 * description: 방에 참여한 멤버의 고유 식별자 (외부 IDP / Supabase Auth UID 매핑 구조)
 * example: "d3b07384-d113-4c4e-a55e-23237174faef"
 * userName:
 * type: string
 * description: 위치 공유 세션 내에서 표시될 사용자의 활동 닉네임 또는 이름
 * example: "홍길동"
 * createdAt:
 * type: string
 * format: date-time
 * description: 사용자가 방에 입장(레코드 생성)한 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 멤버 정보 최종 수정 일시
 */
module.exports = (sequelize) => {
    return sequelize.define('RoomMember', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING, // 외부 인증 공급자(Supabase Auth)의 사용자 식별 토큰 구조와 무결성을 맞추기 위해 STRING 타입 유지
            allowNull: false
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: true
    });
};