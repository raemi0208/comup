/**
 * @file UserLocation.js
 * @description 공유 방에 참여 중인 사용자의 실시간 GPS 위경도 좌표 데이터를 관리하는 Sequelize 모델입니다.
 * 사용자 식별자(userId)를 기본키로 지정하여 이력 누적 없이 최신 위치 스냅샷만 유지(Overwrite)하는 단일 레코드 구조를 형성하며,
 * 타임스탬프의 수정 일시(updatedAt)를 실시간 위치 스트리밍의 최신성 검증 지표로 활용합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * Location:
 * type: object
 * required:
 * - userId
 * - roomId
 * - latitude
 * - longitude
 * properties:
 * userId:
 * type: string
 * description: 위치 정보의 주체인 사용자의 고유 식별자 (단일 사용자당 하나의 최신 스냅샷만 유지하기 위해 기본키로 매핑)
 * example: "d3b07384-d113-4c4e-a55e-23237174faef"
 * roomId:
 * type: integer
 * description: 사용자가 현재 위치를 공유하고 있는 대상 위치 공유 방의 고유 식별 ID
 * example: 104
 * latitude:
 * type: number
 * format: double
 * description: WGS84 좌표계 기준의 고정밀 위도 좌표 (Latitude)
 * minimum: -90
 * maximum: 90
 * example: 48.856614
 * longitude:
 * type: number
 * format: double
 * description: WGS84 좌표계 기준의 고정밀 경도 좌표 (Longitude)
 * minimum: -180
 * maximum: 180
 * example: 2.352221
 * createdAt:
 * type: string
 * format: date-time
 * description: 최초 위치 공유 세션 등록 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: GPS 데이터 최종 스트리밍 수신 및 갱신 일시 (클라이언트 측에서 수신 데이터의 유효 유통기한 판정 시 활용)
 * example: "2026-06-20T17:23:11.000Z"
 */
module.exports = (sequelize) => {
    return sequelize.define('Location', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true // 동일 사용자의 다중 위치 레코드 생성을 제한하고 실시간 덮어쓰기 처리를 보장하기 위한 유일 식별 제약
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false
        }
    }, {
        timestamps: true // 관찰 주체 간의 네트워크 지연 및 세션 탈락 여부를 수신 시점 기준(updatedAt)으로 추적하기 위해 타임스탬프 활성화
    });
};