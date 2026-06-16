/*
□ News.js: 뉴스 테이블 모델
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     News:
 *       type: object
 *       properties:
 *         link:
 *           type: string
 *         countryName:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         pubDate:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const News = sequelize.define('News', {
  // 뉴스 기사마다 고유한 링크가 있으므로 이를 ID(기본키)로 활용
  link: {           // 링크, 기본키
    type: DataTypes.TEXT,
    primaryKey: true,
    allowNull: false
  },
  countryName: {    // 나라 이름
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {          // 기사 제목
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {    // 본문
    type: DataTypes.TEXT,
    allowNull: true
  },
  pubDate: {        // 날짜
    type: DataTypes.STRING, // 네이버에서 주는 날짜 문자열 그대로 저장
    allowNull: true
  }
}, {
  timestamps: true // 언제 수집했는지 알 수 있게 생성시간 자동 기록
});

module.exports = News;