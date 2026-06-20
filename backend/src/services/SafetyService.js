/**
 * @file SafetyService.js
 * @description 대한민국 공공데이터포털(외교부 최신 국가안전정보 API)로부터 안전 소식 원격 자원을 수집하고
 * 데이터 정제(Deduplication) 과정을 거쳐 시스템 영속성 계층(SafetyInfo)에 배치 적재하는 서비스 레이어입니다.
 */

const axios = require('axios'); // 원격 HTTP 통신 클라이언트 모듈
const xml2js = require('xml2js'); // XML 데이터 파싱 및 구조 가공 엔진
const SafetyInfo = require('../models/SafetyInfo'); // 안전 정보 데이터베이스 오브젝트 맵퍼 모델
require('dotenv').config(); // 런타임 환경 설정 변수 주입 구성 로드

/**
 * 외교부 안전 정보 엔드포인트 데이터를 스케줄링 배치 형식으로 인제스천(Ingestion)하여 멱등성이 보장된 동기화를 수행합니다.
 * @returns {Promise<void>}
 */
const fetchAndSaveSafetyData = async () => {
    try {
        console.log("[INFO] 외교부 원격 오픈 API 국가 안전 정보 데이터 동기화 프로세스 가동");

        // 1. 외교부 원격 오픈 API 엔드포인트 요청 파라미터 바인딩
        const response = await axios.get('http://apis.data.go.kr/1262000/CountrySafetyService/getCountrySafetyList', {
            params: {
                serviceKey: process.env.SERVICE_KEY, // 인가용 외부 서비스 공개키
                numOfRows: 100,                      // 단일 트랜잭션당 획득할 레코드 한도 수
                pageNo: 1                            // 페이지 인덱스 지정
            }
        });

        console.log("[DEBUG] 원격 API 원본 수신 데이터 페이로드: ", response.data);
        
        // 2. 수신 페이로드 내 XML/JSON 파싱 데이터 레이아웃 트리에 접근하여 엔티티 컬렉션 추출
        const items = response.data.response.body.items.item;

        // 3. 내부 영속성 도메인 스키마 규격 표준 사양서에 맞춘 데이터 직렬화 및 매핑 (Mapping)
        const formattedData = items.map(item => ({
            id: item.id,                   // 데이터 엔티티 고유 식별자 (기본키 매핑)
            countryName: item.countryName, // 국가 식별 명칭
            title: item.title,             // 안전 공지 헤드라인 타이틀
            content: item.content,         // 상세 유의사항 및 안전 지침 본문
            wrtDt: item.wrtDt              // 원격지 공지 최초 발행 일자
        }));

        // 4. 인메모리 기본키 중복 검증 및 데이터 무결성 정제 처리 (Deduplication)
        const uniqueData = [];      // 단일화가 완료된 정제 리소스 배열
        const seenIds = new Set();  // 고유 식별자 추적용 인메모리 해시 셋

        for (const data of formattedData) {
            // 중복되지 않은 신규 엔티티 식별자 세그먼트만 선별하여 컬렉션에 추가
            if (!seenIds.has(data.id)) {
                seenIds.add(data.id);   
                uniqueData.push(data);  
            }
        }

        // 5. 관계형 데이터베이스 배치 트랜잭션 및 벌크 업서트(Upsert) 연동
        await SafetyInfo.bulkCreate(uniqueData, {
            // PostgreSQL의 ON CONFLICT 제약 조건 하에서 기본키 충돌 시 예외 분기를 위한 매핑 특성 명시
            conflictAttributes: ['id'],
            updateOnDuplicate: ['title', 'content', 'wrtDt']
        });

        console.log(`[SUCCESS] 국가 안전 데이터 동기화 파이프라인 완료 - 처리 레코드 수: ${formattedData.length}건`);

    } catch (error) {
        console.error("[ERROR] 데이터 수집 파이프라인 처리 중 런타임 예외 핸들러 트리거:");
        console.error("상세 예외 메시지:", error.message);
    }
};

module.exports = { fetchAndSaveSafetyData };