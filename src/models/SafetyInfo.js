/**
 * @file SafetyInfo.js
 * @description 외교부 공공 데이터 포털 API 등을 통해 수집된 국가별 최신 안전 공지 및 사건사고 정보를 관리하는 Sequelize 모델입니다.
 * 외부 시스템에서 발행하는 고유 문자열 ID를 기본키로 매핑하여 동기화 배치 수행 시 데이터 중복 적재를 방지합니다.
 */

const { DataTypes } = require('sequelize'); 
const sequelize = require('../config/db');   

/**
 * @swagger
 * components:
 * schemas:
 * SafetyInfo:
 * type: object
 * required:
 * - id
 * - countryName
 * properties:
 * id:
 * type: string
 * description: 외부 안전 정보 소스 API에서 제공하는 고유 문서 식별 고유 키
 * example: "ATC0000000001234"
 * countryName:
 * type: string
 * description: 안전 공지 대상 국가 명칭 (영보 상태 및 뉴스 필터링 연동용)
 * example: "프랑스"
 * title:
 * type: string
 * description: 안전 공지 및 사건사고 속보 제목
 * nullable: true
 * example: "파리 중심가 대규모 시위 발생에 따른 신변안전 유의 조치 안내"
 * content:
 * type: string
 * description: 안전 공지 상세 본문 내용 (텍스트 또는 원본 HTML 포맷 수용)
 * nullable: true
 * example: "최근 프랑스 파리 시내에서 발생한 집회와 관련하여 현지 체류 중인 우리 국민께서는..."
 * wrtDt:
 * type: string
 * description: 소스 제공처(외교부 등)에서 원본 문서를 최초 작성 및 발행한 일자 (YYYY-MM-DD 포맷 문자열 유지)
 * nullable: true
 * example: "2026-06-20"
 * createdAt:
 * type: string
 * format: date-time
 * description: 배치 수집 엔진을 통해 해당 안전 정보 레코드가 로컬 DB에 최초 적재된 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 데이터 레코드 최종 수정 일시
 */
const SafetyInfo = sequelize.define('SafetyInfo', {
  id: {                     
    type: DataTypes.STRING,
    primaryKey: true,       // 외부 오픈 API 엔드포인트의 레코드 불변 식별자를 수용하여 멱등성 확보 및 중복 데이터 원천 차단
    allowNull: false
  },
  countryName: {            
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {                  
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {                
    type: DataTypes.TEXT,
    allowNull: true
  },
  wrtDt: {                  
    type: DataTypes.STRING, // 오픈 API 스펙상 제공되는 가변적인 날짜 포맷(예: YYYY-MM-DD)을 변형 없이 파싱하기 위해 STRING 타입 유지
    allowNull: true
  }
}, {
  timestamps: true          // 데이터의 실시간 수집 주기 관리 및 인덱싱 성능 검증을 위해 타임스탬프 기능 활성화
});

module.exports = SafetyInfo;