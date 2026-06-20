/**
 * @file BadgeDef.js
 * @description 시스템에 정의된 전체 뱃지의 마스터 메타데이터를 관리하는 고유 정의 모델입니다.
 * 획득 기준 카테고리와 각 임계값(Threshold) 속성을 포함합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * BadgeDef:
 * type: object
 * required:
 * - name
 * - category
 * - threshold
 * properties:
 * id:
 * type: integer
 * description: 뱃지 정의 고유 식별자 (자동 증가)
 * example: 1
 * name:
 * type: string
 * description: 뱃지 명칭
 * example: "성실한 탐험가"
 * category:
 * type: string
 * description: 뱃지 달성 조건 판정 대상 카테고리
 * enum: [attendance, post, landmark, friend]
 * example: "landmark"
 * threshold:
 * type: integer
 * description: 뱃지 해금을 위해 충족해야 하는 카테고리별 임계 횟수
 * example: 10
 * example:
 * id: 1
 * name: "성실한 탐험가"
 * category: "landmark"
 * threshold: 10
 */
module.exports = (sequelize) => {
    return sequelize.define('BadgeDef', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.TEXT,
            allowNull: false
            // 허용 도메인 필드: 'attendance' | 'post' | 'landmark' | 'friend'
        },
        threshold: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'badges',
        timestamps: false
    });
};