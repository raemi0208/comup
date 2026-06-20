/**
 * @file PostView.js
 * @description 게시글의 어뷰징(새로고침 등을 통한 조회수 조작)을 방지하기 위해 개별 조회 이력을 관리하는 Sequelize 모델입니다.
 * 로그인 사용자는 유저 식별자 토큰 기반으로, 비로그인 사용자는 클라이언트 IP 주소 기반으로 복합 키(viewerKey)를 생성하여 중복 카운팅을 필터링합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * PostView:
 * type: object
 * required:
 * - postId
 * - viewerKey
 * properties:
 * id:
 * type: integer
 * description: 조회 기록 고유 식별자 (자동 증가)
 * example: 1
 * postId:
 * type: integer
 * description: 조회가 발생한 대상 게시글의 고유 식별 ID
 * example: 12
 * viewerKey:
 * type: string
 * description: |
 * 중복 조회 판별을 위한 고유 식별 문자열 키.
 * - 인증 회원인 경우: 'user:{userId}' 포맷
 * - 비인증(게스트) 회원인 경우: 'ip:{IP_Address}' 포맷
 * example: "user:7"
 * createdAt:
 * type: string
 * format: date-time
 * description: 최초 조회 발생(기록 생성) 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 기록 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('PostView', {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    viewerKey: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['postId', 'viewerKey']   // 동일 식별 주체가 단일 게시글을 재방문 및 반복 새로고침할 때 발생하는 데이터 중복 생성을 데이터베이스 계층에서 원천 차단
      }
    ]
  });
};