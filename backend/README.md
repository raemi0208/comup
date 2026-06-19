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
################## supabase 연결 ##################
DATABASE_URL=postgresql://postgres.yoawffmjpsntluvscgwb:dlrhd20202@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres


# 2. 서버 포트 설정 (기본값 3000)
PORT=3000

# 3. 커뮤니티 관리용 시크릿키
# 변수명 = 아무 글자(비밀키)
JWT_SECRET=minsu_capstone_secret_key_0504


################## 데이터 #################
# 공공데이터포털 설정
# 발급받은 '일반 인증키(Decoding)'를 따옴표 없이 입력하세요.
SERVICE_KEY=43de0de02902684499aeeb210f2b715b0e59c304f289f5c4163338662ba28be9

# 네이버 API 이용 관련
NAVER_CLIENT_ID=p1gTZz3klNKzZVrffobY
NAVER_CLIENT_SECRET=XRiY8JwMNp
```

## [4] License & Notes
* 본 프로젝트는 대학 캡스톤 디자인 졸업 작품용으로 제작되었습니다.
* 외교부 공공 데이터 Open API 가이드라인을 준수합니다.
* 개인정보 보호 및 DB을 확보하기 위해 API 키 및 DB 패스워드는 개발 및 운영 환경 모두에서 상시 분리 관리됩니다.
