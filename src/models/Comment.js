/**
 * @file Comment.js
 * @description 게시글에 종속되는 댓글 데이터를 관리하는 Sequelize 모델입니다.
 * 게시글(Post) 및 작성자(User) 모델과 다대일(N:1) 관계 구조를 형성하여 데이터 무결성을 유지합니다.
 */

const { DataTypes } = require('sequelize'); 

/**
 * @swagger
 * components:
 * schemas:
 * Comment:
 * type: object
 * required:
 * - content
 * properties:
 * id:
 * type: integer
 * description: 댓글 고유 식별자 (자동 증가)
 * example: 1
 * content:
 * type: string
 * description: 댓글 내용 (줄바꿈이 허용되는 텍스트 스트링)
 * example: "좋은 정보 공유해주셔서 감사합니다! 많은 도움이 되었습니다."
 * postId:
 * type: integer
 * description: 댓글이 작성된 대상 게시글의 고유 식별 ID
 * example: 12
 * userId:
 * type: integer
 * description: 댓글을 등록한 유저의 고유 식별 ID
 * example: 7
 * createdAt:
 * type: string
 * format: date-time
 * description: 댓글 작성 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 댓글 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('Comment', {
    content: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    }
  });
};