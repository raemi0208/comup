/*
□ SafetyInfo.js: 국가별_안전정보 테이블 모델 설계도
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     SafetyInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         countryName:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         wrtDt:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/db');   

// 'SafetyInfo' 테이블 정의
const SafetyInfo = sequelize.define('SafetyInfo', {
  id: {                     // 고유 식별자 (명세서의 id 반영)
    type: DataTypes.STRING,
    primaryKey: true,       // 기본키로 설정하여 중복 저장 방지
    allowNull: false
  },
  
  countryName: {            // 국가명
    type: DataTypes.STRING,
    allowNull: false
  },
  
  title: {                  // 제목 (명세서의 title 반영)
    type: DataTypes.STRING,
    allowNull: true
  },
  
  content: {                // 안전 공지 상세 내용
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  wrtDt: {                  // 작성일
    type: DataTypes.STRING, // API 응답이 "2016-07-07" 형태이므로 STRING
    allowNull: true
  }
}, {
  timestamps: true // 생성/수정 시간(createdAt, updatedAt) 자동 생성
});

module.exports = SafetyInfo;