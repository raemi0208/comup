/*
□ WarningLevel.js: 외교부 여행경보 단계 마스터 데이터 모델
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     WarningLevel:
 *       type: object
 *       properties:
 *         level_id:
 *           type: integer
 *         level_name:
 *           type: string
 *         color_code:
 *           type: string
 *         description:
 *           type: string
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WarningLevel = sequelize.define('WarningLevel', {
    level_id: { type: DataTypes.INTEGER, primaryKey: true },
    level_name: { type: DataTypes.STRING, allowNull: false },
    color_code: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false }
}, { 
    timestamps: false, 
    tableName: 'warning_levels' 
});

module.exports = WarningLevel;