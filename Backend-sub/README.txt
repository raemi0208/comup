보통 여기에 뭘 적으려나


[1] 폴더 구조 (□: 파일, ■: 폴더)

TRAVELOFFICE_COMUP - ■ node_modules   - ■ ...
                     ■ src            - ■ config                - □ db.js

                                      - ■ controllers           - □ authController.js
                                                                - □ postController.js

                                      - ■ middlewares           - □ authMiddleware.js

                                      - ■ models                - □ Comment.js
                                                                - □ index.js
                                                                - □ News.js
                                                                - □ Post.js
                                                                - □ SafetyInfo.js
                                                                - □ User.js

                                      - ■ routes                - □ authRoutes.js
                                                                - □ postRoutes.js

                                      - ■ servies               - □ NewsService.js
                                                                - □ SafetyService.js
                                      - ■ utils
                                      - □ app.js(서버 작동 프로세스)
                   - □ .env
                   - □ .gitignore
                   - □ README.txt
                   - □ package-lock.json
                   - □ package.json


[2] 파일 설명 - config 폴더
□ db.js: DB 연결
    .env 파일에서 정보 가져오고 -> DB 객체(sequelize 라이브러리 이용) 생성 -> 내보내기

[3] 파일 설명 - controllers 폴더
□ authController.js: 회원가입 및 로그인 처리
□ postController.js: POST 관리 (POST 목록 찾기, POST 생성, POST 삭제)

[4] 파일 설명 - middlewares 폴더
□ authMiddleware.js: 로그인 로직 (토큰 검사 후 userID 부여)

[5] 파일 설명 - models 폴더
□ Comment.js: 댓글 설계도
□ index.js: 커뮤니티 관계 정의
□ News.js: 뉴스 테이블 모델
□ Post.js: POST 모델 설계도
□ SafetyInfo.js: 국가별_안전정보 테이블 모델 설계도
□ User.js: User 모델 설계도

[6] 파일 설명 - routes 폴더
□ authRoutes.js: 회원가입, 로그인 페이지 라우팅
□ postRoutes.js: POST 목록, 쓰기, 삭제 라우팅

[7] 파일 설명 - services 폴더
□ NewsService.js: API를 통해 뉴스 얻고 뉴스 필터링, DB에 저장
□ SafetyService.js: 외교부 API에서 데이터를 가져와서 DB에 저장

[8] 파일 설명 - utils 폴더
