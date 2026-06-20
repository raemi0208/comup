/**
 * @file WarningLevel.js
 * @description 대한민국 외교부 공시 기준 여행경보 단계를 정의하는 마스터 레퍼런스 데이터 모델입니다.
 * 국가별 안전 정보 및 여행 위험도 정보 사이트 구축을 위한 메타 테이블로 사용되며, 
 * 가변적인 데이터가 아니므로 최적화를 위해 타임스탬프 생성을 비활성화한 고정형 마스터 딕셔너리 구조를 가집니다.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * @swagger
 * components:
 * schemas:
 * WarningLevel:
 * type: object
 * required:
 * - level_id
 * - level_name
 * - color_code
 * - description
 * properties:
 * level_id:
 * type: integer
 * description: 외교부 표준 여행경보 단계 등급 식별자 (기본키)
 * example: 1
 * level_name:
 * type: string
 * description: 해당 위험도 등급의 명칭 (예: 여행유의, 여행자제, 출국권고, 여행금지)
 * example: "1단계 (여행유의)"
 * color_code:
 * type: string
 * description: 프론트엔드 UI/UX 시각화를 위한 헥사(HEX) 컬러 코드 수치
 * example: "#0055A5"
 * description:
 * type: string
 * description: 해당 단계 발령 시 여행자 행동 지침 및 위험 요약 가이드라인 내용
 * example: "신변안전 위험 요인이 숙지되는 지역으로, 체류 자제 및 신변안전에 특별한 유의가 필요함"
 */
const WarningLevel = sequelize.define('WarningLevel', {
    level_id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true 
    },
    level_name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    color_code: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
}, { 
    timestamps: false, 
    tableName: 'warning_levels' 
});

module.exports = WarningLevel;