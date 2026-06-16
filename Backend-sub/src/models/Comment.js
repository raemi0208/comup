/*
□ Comment.js: 댓글 설계도
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

const { DataTypes } = require('sequelize'); 


module.exports = (sequelize) => {
  return sequelize.define('Comment', {
    
    // 댓글 형식: 내용(긴 텍스트 타입)(필수)
    content: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    }
  });
};