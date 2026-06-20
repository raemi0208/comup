/**
 * @file CountrySafetyStatus.js
 * @description 외교부 및 공공 API 연동을 통해 수집된 국가별 여행경보 단계 및 운영 상태를 관리하는 Sequelize 모델입니다.
 * WarningLevel 모델과의 다대일(N:1) 단방향 관계 설정을 통해 데이터 정규화를 유지합니다.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const WarningLevel = require('./WarningLevel');

/**
 * @swagger
 * components:
 * schemas:
 * CountrySafetyStatus:
 * type: object
 * required:
 * - country_name
 * properties:
 * country_id:
 * type: integer
 * description: 국가별 안전 상태 기록 고유 식별자 (자동 증가)
 * example: 1
 * country_name:
 * type: string
 * description: 국가 명칭 (공식 국문 표기명)
 * unique: true
 * example: "프랑스"
 * level_id:
 * type: integer
 * description: WarningLevel 마스터 모델을 참조하는 여행경보 단계 고유 식별자
 * nullable: true
 * example: 2
 * country_iso_alp2:
 * type: string
 * maxLength: 2
 * description: ISO 3166-1 alpha-2 기준 2자리 국가 코드
 * nullable: true
 * example: "FR"
 * updated_at:
 * type: string
 * format: date-time
 * description: 외부 안전 정보 API 동기화 및 데이터 최종 수정 일시
 * example: "2026-03-20T17:15:00.000Z"
 */
const CountrySafetyStatus = sequelize.define('CountrySafetyStatus', {
    country_id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    country_name: { 
        type: DataTypes.STRING, 
        allowNull: false,
        unique: true // 공공 API 배치 업데이트 시 Upsert 판정 기준으로 활용하기 위해 고유키 설정
    },
    level_id: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    },
    country_iso_alp2: {
        type: DataTypes.STRING(2),
        allowNull: true
    }
}, { 
    timestamps: true,        // Sequelize 타임스탬프 기능 활성화
    createdAt: false,        // 테이블 물리 스키마 정의에 맞춰 생성 일시는 기록에서 제외
    updatedAt: 'updated_at', // 데이터 수정 일시를 데이터베이스 도메인 컬럼명인 'updated_at'에 매핑
    tableName: 'country_safety_status' 
});

// 연관 관계 설정: 국가 안전 상태 레코드는 경보 단계 마스터 레코드(WarningLevel)를 참조함
CountrySafetyStatus.belongsTo(WarningLevel, { foreignKey: 'level_id', targetKey: 'level_id' });

module.exports = CountrySafetyStatus;