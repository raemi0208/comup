**🌍 Global Travel Guard - Cloud Database & Schema Design**

- 국내외 실시간 여행 안전 정보 및 위치 기반 커뮤니티 플랫폼을 위한 클라우드 데이터베이스 시스템

- 본 프로젝트는 글로벌 안전 API 데이터, 국내 로컬 GIS(축제/재난) 데이터, 그리고 사용자 커뮤니티 데이터를 아우르는 관계형 데이터베이스(RDBMS) 아키텍처 설계입니다. 클라우드 인프라(Supabase PostgreSQL)를 기반으로 구축되었으며, SQL 클라이언트(DBeaver)를 통해 데이터 마이그레이션 및 정밀 쿼리 제어를 수행합니다.

**🛠️ Tech Stack**

Database: Supabase (Cloud PostgreSQL)

Database Administration: DBeaver (SQL Client & DB Control)

Database Language: PostgreSQL SQL (DDL, DML)

**📊 Database Schema (ERD & Architecture)**

- 본 데이터베이스는 supabase-schema-yoawffmjpsntluvscgwb.png 스키마를 기반으로 총 3가지 핵심 데이터 서비스 축(3-Pillar)으로 구성되어 강력한 참조 무결성을 유지합니다.

**1. 커뮤니티 및 회원 관리 (Core Entity Layer)**

사용자의 소통과 실시간 정보 교환을 제어하는 핵심 관계형 스키마입니다.

users (사용자): 시스템 이용자 기본 정보 보존 (이메일, 암호화 비밀번호, 별명 등).

posts (게시물): 사용자가 등록한 후기 및 동행 글 (조회수 카운팅, users와 1:N 관계).

comments (댓글): 게시글에 실시간으로 달리는 피드백 데이터 (포스트 및 사용자 1:N 이중 매핑).

**2. 글로벌 여행 안전 데이터 (Global API Cache Layer)**

외교부 안전 API 및 글로벌 정보 송출을 위한 캐시 데이터 인프라입니다.

countries (국가): 전 세계 국가의 기본 코드, 위도, 경도 및 실시간 안전 수준 경보 데이터 보존.

api_safety_data (안전 소식): 외교부 API 데이터를 기반으로 적재된 전 세계 실시간 긴급 공지 보관 테이블.

안전정보 / 소식: 국가별 안전 매뉴얼 및 외부 뉴스 링크 보관 레이어.

**3. 로컬 관광 및 재난 통제 데이터 (Local GIS Layer)**

실시간 위치 매핑과 로컬 콘텐츠 힐링을 돕는 하이브리드 공간 레이어입니다.

festivals (축제): 위도/경도 고정 소수점 데이터 및 전화번호, 홈페이지 등 18개 표준화 칼럼을 지닌 전국 축제 정보.

disaster_risk_areas (재난 위험 지역): 특보 등급, 통제 성격 및 실시간 공간 대조를 위한 위치 기반 위험 구역 정보.

여행사: 비즈니스 모델(B2B) 연동을 위한 전용 엔티티.

**🔑 Key Engineering Accomplishments (핵심 성과)**

클라우드 데이터 가용성 및 원격 데이터 인프라 구축

- 로컬 DB의 물리적 한계를 극복하기 위해 클라우드 서비스인 Supabase PostgreSQL을 도입, 팀원 누구나 원격으로 실시간 데이터베이스 세트에 동시 접근할 수 있는 협업 환경을 구축했습니다.

DBeaver를 통한 체계적인 대용량 데이터 적재

- 전국 문화 축제 정보 표준 데이터 등 대용량 로컬 데이터를 SQL 클라이언트(DBeaver)의 파일 마이그레이션 도구를 활용하여 유실 없이 스키마에 부합하도록 적재 완료했습니다.

정밀 GIS 공간 데이터 설계를 통한 오차 최소화

- 지도 기반 시각화를 지원하기 위해 latitude 및 longitude 컬럼을 정밀 수치형 데이터인 DECIMAL(10, 8) 및 DECIMAL(11, 8)로 구축하여 공간 마커 오차 범위를 밀리미터 단위로 정교하게 설계했습니다.

엄격한 데이터 무결성 검증 정책 수립

- 중복 적재 방지를 위해 주요 텍스트 데이터의 유니크 제약조건(Unique Constraints) 및 외래키(FK) 참조 관계를 설정하여 데이터 변질을 원천 차단했습니다.

**⚙️ Connection Guide (DBeaver 연결 설정)**

클라우드 데이터베이스 서버 관리를 위해 DBeaver에서 아래 설정으로 보안 세션을 연결합니다. (인증 정보 공유 금지)

Connection Type: PostgreSQL

Host: aws-0-ap-northeast-2.pooler.supabase.com (본인의 Supabase Host 주소 입력)

Port: **5432** (PostgreSQL 표준 포트)

Database: postgres

Username: postgres (또는 지정된 DB 사용자명)

Password: your_supabase_db_password

**🛡️ Supabase Cloud DB 가용성 보장 안내**

본 서비스는 **PostgreSQL 기반 Supabase Cloud 무료 티어**를 사용합니다.

Supabase 정책상 **7일 이상** 데이터베이스 쿼리 요청이 없을 시 프로젝트가 일시중지(Pause) 처리됩니다.

일시중지 시, Supabase 대시보드에 접속 후 **[Restore Project]** 버튼을 통해 간편하게 즉시 복원이 가능합니다. (데이터는 완벽하게 안전하게 보존됩니다.)
