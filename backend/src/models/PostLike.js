/**
 * @file PostLike.js
 * @description 커뮤니티 게시글에 대한 사용자의 좋아요(추천) 상호작용 내역을 관리하는 교차 엔티티 모델입니다.
 * 특정 게시글(postId)과 사용자(userId)의 관계 스냅샷 역할을 하며, 데이터의 존재 여부로 좋아요 활성화 상태를 판정합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * PostLike:
 * type: object
 * required:
 * - postId
 * - userId
 * properties:
 * id:
 * type: integer
 * description: 좋아요 기록 고유 식별자 (자동 증가)
 * example: 1
 * postId:
 * type: integer
 * description: 좋아요 처리가 발생한 대상 게시글의 고유 식별 ID
 * example: 12
 * userId:
 * type: integer
 * description: 좋아요를 요청한 사용자의 고유 식별 ID
 * example: 7
 * createdAt:
 * type: string
 * format: date-time
 * description: 좋아요 등록 일시 (활성화 시점)
 * updatedAt:
 * type: string
 * format: date-time
 * description: 기록 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('PostLike', {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId']   // 동일 사용자가 단일 게시글에 대해 중복으로 좋아요 레코드를 생성하는 행위를 원천 차단하기 위한 복합 유니크 인덱스 설정
      }
    ]
  });
};