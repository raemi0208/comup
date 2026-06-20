/**
 * @file Room.js
 * @description 그룹 간 실시간 위치 정보 공유를 위한 세션 방(Room) 데이터를 관리하는 Sequelize 모델입니다.
 * 고유 참여 코드 기반의 입장 시스템 및 리소스 자동 만료 처리를 위한 유효기간(expiresAt) 정책을 포함합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * Room:
 * type: object
 * required:
 * - roomCode
 * - hostUserId
 * - expiresAt
 * properties:
 * id:
 * type: integer
 * description: 위치 공유 방 고유 식별자 (자동 증가)
 * example: 104
 * roomName:
 * type: string
 * description: 위치 공유 방의 명칭
 * default: "우리들의 안전 여행 방"
 * example: "파리 배낭여행 소대 위치 공유"
 * roomCode:
 * type: string
 * maxLength: 6
 * description: 그룹 멤버 초대를 위한 난수 기반의 고유 6자리 참여 코드
 * unique: true
 * example: "X7K2WP"
 * hostUserId:
 * type: string
 * description: 방을 개설한 호스트의 고유 고유 식별자 (외부 IDP / Supabase Auth UID 구조 매핑)
 * example: "d3b07384-d113-4c4e-a55e-23237174faef"
 * expiresAt:
 * type: string
 * format: date-time
 * description: 실시간 위치 공유 세션이 자동 종료 및 파기되는 만료 일시
 * example: "2026-06-21T17:21:35.000Z"
 * createdAt:
 * type: string
 * format: date-time
 * description: 방 개설(레코드 생성) 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 방 정보 최종 수정 일시
 */
module.exports = (sequelize) => {
    const Room = sequelize.define('Room', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        roomName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '우리들의 안전 여행 방'
        },
        roomCode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            unique: true // 무작위 생성되는 6자리 고유 참여 코드 엔트로피 확보 및 중복 방지 제약
        },
        hostUserId: {
            type: DataTypes.STRING, // 인증 서브시스템(Supabase Auth)의 고유 식별 주체(UUID/String)와 데이터 무결성 연동
            allowNull: false
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        timestamps: true
    });
    
    return Room;
};