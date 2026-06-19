/*
□ CountrySafetyStatus.js: 국가별 여행경보 상태 운영 데이터 모델
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     CountrySafetyStatus:
 *       type: object
 *       properties:
 *         country_id:
 *           type: integer
 *         country_name:
 *           type: string
 *         level_id:
 *           type: integer
 *         updated_at:
 *           type: string
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const WarningLevel = require('./WarningLevel');

const CountrySafetyStatus = sequelize.define('CountrySafetyStatus', {
    country_id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true // 1, 2, 3... 자동으로 번호가 부여
    },
    country_name: { 
        type: DataTypes.STRING, 
        allowNull: false,
        unique: true // ★ API 업데이트 시 이름으로 중복을 찾기 위해 고유키(Unique) 설정 필수!
    },
    level_id: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    }
}, { 
    timestamps: true,        // 시간 자동 기록 기능 켜기
    createdAt: false,        // 설계도에 없으므로 생성 시간은 기록 안 함
    updatedAt: 'updated_at', // 수정 시간을 설계도의 'updated_at' 컬럼명으로 맞춤
    tableName: 'country_safety_status' 
});

// 관계 설정 (CountrySafetyStatus는 WarningLevel을 참조함)
CountrySafetyStatus.belongsTo(WarningLevel, { foreignKey: 'level_id', targetKey: 'level_id' });

module.exports = CountrySafetyStatus;
