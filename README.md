✈️ 여행 안전 정보 및 축제 데이터 서비스 (Backend)

이 프로젝트는 국가별 안전 정보와 국내외 축제 데이터를 수집하여 제공하는 백엔드 서버입니다.
DB 관리자 김다빈이 구축한 MySQL 기반의 REST API 서버입니다.

🛠️ 기술 스택

Runtime: Node.js

Framework: Express.js

Database: MySQL (Port: 3307)

Module System: CommonJS (CJS)

Library: mysql2, cors, dotenv, axios

🚀 개발 및 트러블슈팅 기록

1. 모듈 시스템 전환 (ESM -> CommonJS)

문제: import 구문 사용 시 실행 에러 발생.

해결: package.json에서 "type": "module"을 제거하고, require 방식을 사용하는 CommonJS로 코드를 전면 수정하여 호환성 확보.

2. 서버 실행 에러 (Port Reference Error)

문제: 서버 실행 시 port is not defined 에러 발생.

해결: const port = 5000; 변수를 명시적으로 선언하여 서버가 리스닝할 포트 번호를 지정함.

3. GitHub 업로드 및 브랜치 충돌 해결

문제: src refspec main does not match any 및 fetch first 에러 발생.

해결:

**git branch -M main**으로 로컬 브랜치 이름을 main으로 통일.

**git push -u origin main --force**를 사용하여 원격 저장소와의 기록 차이를 강제로 동기화하여 업로드 성공.

⚠️ 예상되는 오류 및 해결 가이드 (Troubleshooting)

팀원들이 프로젝트를 내려받아 실행할 때 발생할 수 있는 오류들입니다.

Q1. Cannot find module 'express' 에러가 나요.

원인: .gitignore 설정으로 인해 node_modules 폴더가 업로드되지 않았기 때문입니다.

해결: 프로젝트 폴더에서 npm install 명령어를 실행하여 필요한 패키지를 모두 설치하세요.

Q2. Access denied for user 'travel_admin'@'localhost' (DB 연결 실패)

원인: 다빈 님의 로컬 DB 설정과 팀원의 환경이 다르기 때문입니다.

해결: server.js의 mysql.createConnection 부분에서 **user, password, port**를 본인의 MySQL 설정에 맞게 수정해야 합니다.

Q3. Table 'travel_office.countries' doesn't exist

원인: DB 연결은 성공했으나, 쿼리를 날릴 테이블이 생성되지 않았을 때 발생합니다.

해결: 제공된 SQL 스크립트를 실행하여 countries 및 festivals 테이블을 먼저 생성해야 합니다.

📅 향후 계획

[ ] 공공데이터 API를 활용한 안전 정보 자동 수집 기능 구현

[ ] .env 파일을 활용한 DB 보안 강화

[ ] **리액트(Frontend)**와 Axios를 활용한 데이터 연동

Maintained by 김다빈 (DB Administrator)
