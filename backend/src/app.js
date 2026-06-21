/**
 * @file app.js
 * @description 시스템 가동을 위한 메인 진입점(Entry Point)입니다. 
 * 환경 변수 로드, 글로벌 인가 미들웨어 적재, 데이터베이스 오케스트레이션(Sequelize SYNC), 
 * 오픈 API 수집 배치 스케줄러(Node-Cron) 관리 및 라우팅 인프라를 통합 관리합니다.
 */

// 1. 글로벌 환경 변수(Environment Variables) 컴포넌트 활성화
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 2. 외부 프레임워크 코어 및 필수 의존성 모듈 로드
const express = require('express');       
const cors = require('cors');             
const app = express();                    
const sequelize = require('./config/db'); 
const cron = require('node-cron');  
const PORT = process.env.PORT || 3000; 

/* ==========================================
 * 3. 글로벌 미들웨어 파이프라인 (Pre-Routing Middlewares)
 * ========================================== */
// 교차 출처 자원 공유(CORS) 전체 도메인 허용 설정
app.use(cors()); 
// HTTP 요청 본문 파싱 규격 정의 (JSON 및 URL-Encoded 데이터 디코딩 처리)
app.use(express.json());    
app.use(express.urlencoded({ extended: false }));

/* ==========================================
 * 4. 실시간 위치 정보 도메인 라우팅 (GPS Telemetry Service)
 * ========================================== */
const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes); 

/* ==========================================
 * 5. API 인덱싱 및 인터페이스 문서화 규격 (Swagger OpenAPI Spec)
 * ========================================== */
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

/* ==========================================
 * 6. 데이터 인제스천 외부 통합 서비스 레이어 (External Data Services)
 * ========================================== */
const { fetchAndSaveSafetyData } = require('./services/SafetyService'); 
const { fetchAndSaveNews } = require('./services/NewsService'); 
const { fetchAndSaveSafetyStatusData } = require("./services/SafetyLevelService"); 

/* ==========================================
 * 7. 비즈니스 도메인별 라우팅 레이어 바인딩 (Application Routing)
 * ========================================== */
const postRoutes = require('./routes/postRoutes'); 
const authRoutes = require('./routes/authRoutes'); 
const mypageRoutes = require('./routes/MyPageRoutes'); 
const checklistRoutes = require('./routes/ChecklistRoutes'); 

app.use('/api/posts', postRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/mypage', mypageRoutes); 
app.use('/api/checklist', checklistRoutes); 

/* ==========================================
 * 8. 인프라 초기화 및 가동 서브루틴 (Bootstrap Orchestration)
 * ========================================== */
async function startServer() {
  try {
    /* 8-1. 영속성 계층(ORM) 컨텍스트 유효성 검증 및 데이터베이스 스키마 동기화 */
    await sequelize.sync({ force: false });
    console.log('[SUCCESS] Supabase(PostgreSQL) 데이터베이스 동기화 및 엔티티 매핑 완료');

    /*
     * [NOTE] 인스턴스 재기동 시 세션 연속성 보존 정책 기반 설계 수정 사항
     * 기존에 존재하던 인스턴스 초기화 시점의 방 데이터 영구 소멸(TRUNCATE) 메커니즘을 전면 제거함.
     * 클라이언트 사이드 데이터 지속성(LocalStorage 세션 복구 및 재진입 구조)과의 논리적 무결성을 보장하며,
     * 자원 정리는 데이터베이스 내 명시된 개별 세션의 라이프사이클 속성(Room.expiresAt, 생성 후 24시간)을
     * 기준으로 스케줄러를 통해 선별적으로 폐기 처리하도록 도메인을 격리함.
     */

    /* 8-2. 공공데이터포털(외교부 원격 API) 마스터 데이터 주기적 동기화 크론 배치 (매 시 정각 실행) */
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] 외교부 공공 데이터 포털 국가별 최신 여행 경보 지표 동기화 가동');
        await fetchAndSaveSafetyData();
        await fetchAndSaveSafetyStatusData(); 
    });

    /* 8-3. 글로벌 재난 속보 및 위기 징후 뉴스 데이터 인제스천 배치 라인 정의 */
    const allCountries = [
        '덴마크', '일본', '미국', '프랑스', '영국', '독일', '베트남', '태국',
        '필리핀', '인도네시아', '이탈리아', '스페인', '호주', '캐나다', '멕시코',
        '브라질', '러시아', '중국', '대만', '싱가포르', '말레이시아', '인도',
        '튀르키예', '스위스', '네덜란드', '벨기에', '오스트리아', '그리스'
    ];
    let currentIndex = 0;

    // 대량 API 요청에 따른 원격지 밴(Ban) 및 Rate Limit 방지를 위해 매일 새벽 2시 순차 배치 동기화 실행
    cron.schedule('0 2 * * *', async () => {
        console.log('[CRON] 글로벌 위기 징후 및 공공 안전 뉴스 정기 배치 인제스천 개시');

        for (const country of allCountries) {
            await fetchAndSaveNews(country);
            // 원격지 트래픽 분산을 위한 1000ms 인위적 타임 딜레이(Throttle) 부여
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('[SUCCESS] 정기 데이터 파이프라인 동기화 완료 - 전체 대상 국가 반영 완료');
    });

    /* 8-4. 애플리케이션 콜드 스타트 시점 초기 캐싱 데이터 웜업 로직 (Cold Start Warm-up) */
    console.log('[INFO] 초기화 시점 인메모리 및 영속성 계층 데이터 웜업 파이프라인 기동');

    await fetchAndSaveSafetyData();
    await fetchAndSaveSafetyStatusData();

    // 트래픽 집중 국가 우선 순위 기반 1차 웜업 데이터 세그먼트 정의
    const initialCountries = ['덴마크', '일본', '미국', '프랑스', '영국', '독일', '태국', '베트남'];
    for (const country of initialCountries) {
        await fetchAndSaveNews(country);
        // 초기 기동 속도 조절을 위한 500ms 네트워크 스로틀링(Throttling) 적용
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    /* 8-5. HTTP 네트워크 포트 리스닝 바인딩 및 소켓 개방 */
    app.listen(PORT, () => {
      console.log(`[SUCCESS] 웹 서버 소켓 바인딩 완료 - 인프라 스트림 가동 주소: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('[CRITICAL] 어플리케이션 부트스트랩 인프라 가동 중 예외 핸들러 오류 발생:', error);
  }
}

// 4. 어플리케이션 서브루틴 최종 구동
startServer();
