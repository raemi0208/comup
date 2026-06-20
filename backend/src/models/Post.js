/**
 * @file Post.js
 * @description 커뮤니티 게시판의 게시글(원글) 데이터를 관리하는 Sequelize 모델입니다.
 * 작성자(User) 및 피종속 엔티티들(Comment, PostLike, PostView)과의 유기적인 연관 관계를 가지며,
 * 빈번한 집계(Aggregation) 쿼리 부하를 줄이기 위해 조회수와 좋아요 수의 카운터 캐시 필드를 포함합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * Post:
 * type: object
 * required:
 * - title
 * - content
 * properties:
 * id:
 * type: integer
 * description: 게시글 고유 식별자 (자동 증가)
 * example: 12
 * title:
 * type: string
 * description: 게시글 제목
 * example: "유럽 배낭여행 중 소매치기 예방 및 대처 팁 공유"
 * content:
 * type: string
 * description: 게시글 본문 텍스트 (마크다운 또는 롱텍스트 포맷 수용)
 * example: "최근 주요 관광지 주변에서 발생하는 스마트폰 날치기 수법과 안전 가방 고르는 법을 정리했습니다..."
 * category:
 * type: string
 * description: 게시글 분류 카테고리 기호
 * default: "general"
 * example: "travel_tips"
 * views:
 * type: integer
 * description: 해당 게시글의 누적 조회수 (PostView 중복 방지 필터링과 동기화됨)
 * default: 0
 * example: 145
 * likes:
 * type: integer
 * description: 해당 게시글이 받은 누적 좋아요 수 (PostLike 테이블의 집계 반영 데이터)
 * default: 0
 * example: 32
 * userId:
 * type: integer
 * description: 게시글을 작성한 사용자의 고유 식별 ID (외래키)
 * example: 7
 * createdAt:
 * type: string
 * format: date-time
 * description: 게시글 최초 생성 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 게시글 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('Post', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'general'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 조인 성능 최적화 및 실시간 정렬 집계 부하 절감을 위한 누적 좋아요 수 counter cache 컬럼
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true
  });
};