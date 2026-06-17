## [1] Directory Structure (□: 파일, ■: 폴더)

    TRAVELOFFICE_COMUP - ■ node_modules   - ■ ...
                         ■ src            - ■ config                - □ db.js

                                          - ■ controllers           - □ authController.js
                                                                    - □ postController.js
                                                                    - □ roomController.js

                                          - ■ middlewares           - □ authMiddleware.js

                                          - ■ models                - □ Comment.js
                                                                    - □ CountrySafetyStatus.js
                                                                    - □ index.js
                                                                    - □ News.js
                                                                    - □ Post.js
                                                                    - □ RoomMember.js
                                                                    - □ SafetyInfo.js
                                                                    - □ TravelRoom.js
                                                                    - □ User.js
                                                                    - □ UserLocation.js
                                                                    - □ WarningLevel.js

                                          - ■ routes                - □ authRoutes.js
                                                                    - □ postRoutes.js
                                                                    - □ roomRoutes.js

                                          - ■ servies               - □ NewsService.js
                                                                    - □ SafetyService.js
                                                                    - □ SafetyLevelService.js
                                          - □ app.js(서버 작동 프로세스)
                       - □ .env
                       - □ .gitignore
                       - □ README.md
                       - □ package-lock.json
                       - □ package.json

## [2] Getting Started
* Installation
```Bash
# 의존성 패키지 설치
npm install
```
* Usage
```Bash
# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start
```

## [3] .env Setting
```
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase PostgreSQL Configuration
DB_HOST=your-supabase-project-host.pooler.supabase.com
DB_USER=postgres.your_project_id
DB_PASSWORD=your_supabase_database_password
DB_NAME=postgres
DB_PORT=6543

# Connection URI (If used)
DATABASE_URL=postgresql://postgres.your_project_id:your_supabase_database_password@your-supabase-host:6543/postgres

# Location Service & Maps API
MAP_API_KEY=your_maps_api_key

# Supabase Client SDK Keys (If required)
SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

## [4] License & Notes
* 본 프로젝트는 대학 캡스톤 디자인 졸업 작품용으로 제작되었습니다.
* 외교부 공공 데이터 Open API 가이드라인을 준수합니다.
* 개인정보 보호 및 DB을 확보하기 위해 API 키 및 DB 패스워드는 개발 및 운영 환경 모두에서 상시 분리 관리됩니다.