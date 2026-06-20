/**
 * @file User.js
 * @description 시스템의 사용자 계정 및 인증 데이터를 관리하는 핵심 Sequelize 모델입니다.
 * 고유 식별자(id)를 기반으로 이메일 인증 식별자, 암호화된 패스워드, 활동 닉네임을 관리합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * User:
 * type: object
 * required:
 * - email
 * - password
 * - nickname
 * properties:
 * id:
 * type: integer
 * description: 사용자 고유 식별자 (자동 증가 기본키)
 * example: 7
 * email:
 * type: string
 * format: email
 * description: 사용자의 로그인용 고유 이메일 주소 (시스템 내 유일성 보장)
 * example: "traveler@example.com"
 * password:
 * type: string
 * description: 보안 가이드라인에 따라 단방향 해시 함수(예: bcrypt)로 암호화된 비밀번호 문자열
 * example: "$2b$12$K3v9XmY7zPqW..."
 * nickname:
 * type: string
 * description: 커뮤니티 및 위치 공유 서비스 내에서 사용될 사용자의 활동 닉네임
 * example: "글로벌방랑자"
 * createdAt:
 * type: string
 * format: date-time
 * description: 계정 생성 및 회원 가입 완료 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 회원 정보 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('User', {
    // 식별성 확보 및 명확한 데이터 매핑을 위해 기본키 인덱스를 명시적으로 선언
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