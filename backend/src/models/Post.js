/*
□ Post.js: POST 모델 설계도
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         category:
 *           type: string
 *         views:
 *           type: integer
 *         userId:
 *           type: integer
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // 'Post'라는 이름의 테이블을 정의
  return sequelize.define('Post', {
    title: { // 제목: 문자열 타입, 필수!(allowNull: false)
      type: DataTypes.STRING, 
      allowNull: false 
    },
    
    content: { // 내용: 긴 텍스트 타입, 필수!
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    
    category: { // 카테고리: 글의 종류 (기본값은 'general')
      type: DataTypes.STRING, 
      defaultValue: 'general' 
    },
    
    views: { // 조회수: 숫자 타입, 시작은 0번
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    }
  }, {
    // createdAt, updatedAt 컬럼을 자동으로 생성
    timestamps: true 
  });
};

