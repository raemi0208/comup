/**
 * @file db.js
 * @description Sequelize ORM을 사용하여 Supabase(PostgreSQL) 데이터베이스와의 연결을 설정하고 관리하는 모듈입니다.
 * .env 파일에 정의된 환경 변수를 기반으로 보안 연결(SSL)을 수립합니다.
 */

// 환경 변수 및 라이브러리 로드
require('dotenv').config();                 // .env 파일에 등록된 환경 변수를 process.env로 로드
const { Sequelize } = require('sequelize'); // Sequelize ORM 라이브러리 임포트

// Supabase PostgreSQL 연결 인스턴스 생성
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',       // 연결할 데이터베이스 관리 시스템(DBMS) 종류
  logging: false,            // 콘솔에 실행되는 SQL 쿼리 로그 출력 여부 (프로덕션 환경을 위해 비활성화)
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Supabase 원격 클라우드 접속을 위한 SSL 보안 통신 필수 설정
    }
  }
});

// 외부 모듈에서 데이터베이스 인스턴스를 사용할 수 있도록 내보내기
module.exports = sequelize;