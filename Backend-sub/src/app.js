// 1. 환경 변수를 위해 path 얻어오기
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });  // .env 환경변수 활성화

// 2. 필요한 모듈 불러오기 & Port 번호
const express = require('express');       // 익스프레스 프레임워크 
const app = express();                    // 익스프레스 객체 설정
const sequelize = require('./config/db'); // DB 연결 설정을 위한 라이브러리
const cron = require('node-cron');  // 자동화 업데이트를 위한 라이브러리
const PORT = process.env.PORT || 3000; // .env에 포트가 없으면 3000번 사용       

/* --------------- 스웨거 관련 서비스 ------------- */
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '여행 안전 정보 & 커뮤니티 API',
      version: '1.0.0',
      description: '캡스톤 프로젝트용 API 공식 문서입니다.',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  
  apis: [
    './routes/*.js', 
    './models/*.js',
  ],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/* --------------- API 관련 서비스 ---------------*/ 
const { fetchAndSaveSafetyData } = require('./services/SafetyService'); // 나라 정보
const { fetchAndSaveNews } = require('./services/NewsService'); // 뉴스 서비스 
const { fetchAndSaveSafetyStatusData } = require("./services/SafetyLevelService") // 나라 여행레벨 정보

/* --------------- 기본 미들웨어 등록 --------------- */
app.use(express.json());    // for JSON 데이터 
app.use(express.urlencoded({ extended: false }));



/* --------------- 라우팅 파일 등록 --------------- */
const postRoutes = require('./routes/postRoutes'); // 커뮤니티 라우팅
const authRoutes = require('./routes/authRoutes'); // 로그인 라우팅


/* --------------- 라우팅 --------------- */
app.use('/api/posts', postRoutes); // '/api/posts'로 들어오는 모든 요청은 postRoutes로 보냅니다.
app.use('/api/auth', authRoutes); // 로그인 관련은 이 주소로!


// 3. 서버 시작 및 DB 동기화 함수
async function startServer() {
  try {
    /* --------------- 3-1. DB 연결 확인 및 테이블 생성 --------------- */
    // force: false -> 기존 테이블이 있으면 유지 (데이터 보존)
    // force: true  -> 기존 테이블 삭제 후 새로 생성 (연습 시 사용)
    await sequelize.sync({ force: false });
    console.log('✔️ Supabase(PostgreSQL) 데이터베이스 연결 및 테이블 생성 완료!');


    /* --------------- 3-2. 외교부 데이터 정기 업데이트 (정각) ---------------*/
    // '* * * * *'이면 1분마다 동기화 -> 확인
    cron.schedule('0 * * * *', async () => {
        console.log('🌍 국가 정보 업데이트를 시작합니다...');
        await fetchAndSaveSafetyData();
        await fetchAndSaveSafetyStatusData(); // 여행경보(1~4단계) 업데이트!
    });


    /* --------------- 3-3. 네이버 뉴스 데이터 정기 업데이트 --------------- */
    // 전 세계 주요 국가 리스트 (필요시 더 추가)
    const allCountries = [
        '덴마크', '일본', '미국', '프랑스', '영국', '독일', '베트남', '태국', 
        '필리핀', '인도네시아', '이탈리아', '스페인', '호주', '캐나다', '멕시코', 
        '브라질', '러시아', '중국', '대만', '싱가포르', '말레이시아', '인도',
        '튀르키예', '스위스', '네덜란드', '벨기에', '오스트리아', '그리스'
    ]; 
    let currentIndex = 0;

    
    cron.schedule('0 2 * * *', async () => {
        console.log('📰 매일 정기 국가 뉴스 업데이트를 시작합니다...');
        
        // 하루 한 번 실행되므로, 모든 국가를 차례대로 쭉 업데이트합니다.
        for (const country of allCountries) {
            await fetchAndSaveNews(country);
            // 구글 서버에 무리가 가지 않도록 국가마다 1초씩 쉬어줍니다.
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
        console.log('✅ 오늘의 모든 국가 뉴스 업데이트가 완료되었습니다.');
    });

    /* --------------- 3-4. 서버 켜지자마 실행 '초기 동기화' 로직서버가 켜지자마자 각 API에서 데이터를 가져와 DB에 채웁니다. --------------- */
    // 캡스톤 프로젝트 시연 시 데이터가 바로 보이게 하려고 넣는 로직입니다.
    console.log('🖐️ 초기 데이터 동기화를 시작합니다...');

    // 외교부 정보 가져오기
    await fetchAndSaveSafetyData();  // 공지사항 가져오기
    await fetchAndSaveSafetyStatusData();   //여행경보 단계 가져오기
    // 뉴스 정보 가져오기 
    const initialCountries = ['덴마크', '일본', '미국', '프랑스', '영국', '독일', '태국', '베트남'];  // 초기 설정 국가
    for (const country of initialCountries) {
        await fetchAndSaveNews(country);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
 
    /* --------------- 3-5. 실제 서버 대기 상태 시작 --------------- */
    app.listen(PORT, () => {
      console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 중 오류 발생:', error);
  }
  
}


// 4. 서버 실행!
startServer();