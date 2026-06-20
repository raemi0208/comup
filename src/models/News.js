/**
 * @file News.js
 * @description 국가별 실시간 치안 및 사건사고 동향을 파악하기 위해 수집된 뉴스 데이터를 관리하는 Sequelize 모델입니다.
 * 외부 오픈 API(네이버 등) 및 RSS 피드로부터 배치 수집된 인텔리전스 데이터를 적재합니다.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * @swagger
 * components:
 * schemas:
 * News:
 * type: object
 * required:
 * - link
 * - countryName
 * - title
 * properties:
 * link:
 * type: string
 * description: 뉴스 기사의 고유 웹 URL 주소 (기사의 고유성을 보장하므로 기본키로 매핑)
 * example: "https://n.news.naver.com/mnews/article/001/0012345678"
 * countryName:
 * type: string
 * description: 뉴스 콘텐츠와 연관된 대상 국가 명칭 (안전 정보 필터링용)
 * example: "프랑스"
 * title:
 * type: string
 * maxLength: 500
 * description: 뉴스 기사의 제목 (최대 500자 제한)
 * example: "외교부, 프랑스 파리 일부 지역 여행 경보 단계 조정 검토"
 * description:
 * type: string
 * description: 뉴스 기사의 본문 내용 요약 또는 미리보기 텍스트
 * nullable: true
 * example: "최근 파리 인근에서 발생한 대규모 시위와 관련하여 외교부는 현지 체류 중인..."
 * pubDate:
 * type: string
 * description: 뉴스 소스 제공처(출처 API)에서 전달한 원본 발행 일시 문자열 (포맷 가변성 대응을 위해 스트링 보존)
 * nullable: true
 * example: "Fri, 20 Jun 2026 15:30:00 +0900"
 * createdAt:
 * type: string
 * format: date-time
 * description: 배치 스케줄러를 통해 시스템에 뉴스 데이터가 최초 적재(수집)된 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 데이터 레코드 최종 수정 일시
 */
const News = sequelize.define('News', {
  // 기사 고유 URL은 데이터 정속성과 유일성을 완전히 보장하므로 물리적 기본키(PK)로 지정
  link: {           
    type: DataTypes.TEXT,
    primaryKey: true,
    allowNull: false
  },
  countryName: {    
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {          
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {    
    type: DataTypes.TEXT,
    allowNull: true
  },
  pubDate: {        
    type: DataTypes.STRING, // 외부 오픈 API(예: 네이버 뉴스 검색 결과)의 RFC 822 날짜 포맷 규격을 변형 없이 가공용 스트링으로 수용
    allowNull: true
  }
}, {
  timestamps: true // 외부 데이터 동기화 주기 및 최신성 검증을 추적하기 위해 타임스탬프 기능 활성화
});

module.exports = News;