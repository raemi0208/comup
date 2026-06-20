## [1] Directory Structure (□: 파일, ■: 폴더)

```text
TRAVELOFFICE_COMUP/
├── node_modules/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── ChecklistController.js
│   │   ├── CommentController.js
│   │   ├── MypageController.js
│   │   ├── postController.js
│   │   └── roomController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── BadgeDef.js
│   │   ├── CheckList.js
│   │   ├── Comment.js
│   │   ├── CountrySafetyStatus.js
│   │   ├── index.js
│   │   ├── Kickedmember.js
│   │   ├── News.js
│   │   ├── Post.js
│   │   ├── PostLike.js
│   │   ├── PostView.js
│   │   ├── Room.js
│   │   ├── RoomMember.js
│   │   ├── SafetyInfo.js
│   │   ├── User.js
│   │   ├── UserLocation.js
│   │   ├── UserStats.js
│   │   └── WarningLevel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ChecklistRoutes.js
│   │   ├── MyPageRoutes.js
│   │   ├── postRoutes.js
│   │   └── roomRoutes.js
│   ├── services/
│   │   ├── NewsService.js
│   │   ├── SafetyLevelService.js
│   │   └── SafetyService.js
│   └── app.js (서버 진입점 및 실행 프로세스)
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## [2] Getting Started
* Installation
```Bash
# 의존성 패키지 설치
npm install
```
* Usage
```Bash
# 개발 서버 실행
node src/app.js
```

## [3] .env Setting
```
###############################################################################
# @file .env
# @description 시스템 전역에서 참조하는 환경 변수(Environment Variables) 정의 파일입니다.
# 데이터베이스 연결 자격 증명, 애플리케이션 보안 아키텍처 토큰 및 외부 API 크레덴셜을 포함합니다.
###############################################################################

# =============================================================================
# 1. 영속성 계층 연결 구성 (Supabase / PostgreSQL Connection)
# =============================================================================
# 커넥션 풀링(Connection Pooling) 포트(6543) 기반의 데이터베이스 엔드포인트 URI
DATABASE_URL=

# =============================================================================
# 2. 애플리케이션 인프라 구성 (Core Network Settings)
# =============================================================================
# 인바운드 HTTP 요청을 리스닝하기 위한 웹 서버 네트워크 포트 바인딩 값
PORT=3000

# =============================================================================
# 3. 인증 및 권한 부여 보안 아키텍처 (Security & Cryptography)
# =============================================================================
# 세션 상태 및 사용자 인가 상태 검증을 위한 JWT(JSON Web Token) 단방향/양방향 대칭키 서명 시크릿
JWT_SECRET=

# =============================================================================
# 4. 외부 원격 오픈 API 서비스 연동 자격 증명 (External Open API Credentials)
# =============================================================================
# 대한민국 공공데이터포털(외교부 국가별 여행경보 및 안전정보 API) 인가용 일반 디코딩 인증키
SERVICE_KEY=

# 네이버 개발자 센터(Naver Open API) 애플리케이션 식별자 및 통신용 클라이언트 시크릿
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

## [4] License & Notes
* 프로젝트 목적: 본 프로젝트는 대학 캡스톤 디자인 졸업 작품용 백엔드 시스템으로 제작되었습니다.

* 공공 데이터 준수: 외교부 공공 데이터 Open API 가이드라인을 엄격히 준수하여 데이터를 수집 및 활용합니다.

* 보안 가이드라인: 개인정보 보호 및 데이터베이스 자산 보호를 위해 API Key, DB 패스워드 등의 민감 정보는 개발(Dev) 및 운영(Prod) 환경 모두에서 소스코드와 상시 분리하여 .env 환경 변수로 안전하게 관리합니다.
