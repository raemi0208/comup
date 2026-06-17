/*
□ db.js: DB 연결
    [2].env 파일에서 정보 가져오고 -> [3] DB 객체([1] sequelize 라이브러리 이용) 생성 -> [4] 내보내기
*/ 

// DB 연결 설정
require('dotenv').config();                 // [1] .env 파일의 환경변수 로드
const { Sequelize } = require('sequelize'); // [2] sequelize 라이브러리 불러오기

// [3] Supabase 접속 정보 설정 - 주소(URL) 하나로 데이터베이스 연결 객체 생성
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',       // DB 종류
  logging: false,            // 콘솔에 SQL 로그 출력 여부
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Supabase 클라우드 원격 접속을 위한 필수 SSL 보안 설정
    }
  }
});

module.exports = sequelize; // [4] 설정된 객체를 다른 파일에서 쓸 수 있도록 내보냄