/*
□ User.js: User 모델 설계도
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         nickname:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

const { DataTypes } = require('sequelize');

// 유저 관리: 이메일, 비밀번호, 닉네임
module.exports = (sequelize) => {
  return sequelize.define('User', {
    // id를 명시적으로 정의
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    nickname: { type: DataTypes.STRING, allowNull: false }
  });
};