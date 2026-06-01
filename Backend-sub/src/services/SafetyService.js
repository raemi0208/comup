/*
□ SafetyService.js: 외교부 API에서 데이터를 가져와서 DB에 저장
*/ 

const axios = require('axios'); // 외부 서버(외교부)와 통신하기 위한 도구
const xml2js = require('xml2js'); // 외교부가 주는 XML 데이터를 JSON으로 바꾸는 도구
const SafetyInfo = require('../models/SafetyInfo'); // 우리가 만든 DB 테이블 설계도(모델)
require('dotenv').config(); // .env 파일에 숨겨둔 API 키와 DB 비번을 불러오는 설정


const fetchAndSaveSafetyData = async () => {
    try {
        console.log("📢 외교부 API로부터 최신 데이터를 가져오기 시작합니다...");

        // (1) 외교부 API 호출 
        const response = await axios.get('http://apis.data.go.kr/1262000/CountrySafetyService/getCountrySafetyList', {
            params: {
                serviceKey: process.env.SERVICE_KEY, // .env에 저장한 내 인증키
                numOfRows: 100,                      // 한 번에 가져올 데이터 개수
                pageNo: 1                           // 가져올 페이지 번호
            }
        });

        console.log("서버 응답 데이터 원본(확인용): ", response.data);
        
        // (2) API 응답 데이터 추출
        // XML 구조에 따라 response -> body -> items -> item 순서로 들어있다. 
        const items = response.data.response.body.items.item;

        // (3) DB 테이블(SafetyInfo) 형식에 맞게 정리 (Mapping)
        // 명세서 이미지에 있던 영문 항목명(id, countryName, title 등)을 그대로 사용
        const formattedData = items.map(item => ({
            id: item.id,                   // 고유값 (예: ATC000...) -> DB의 Primary Key가 됨
            countryName: item.countryName, // 국가명 (예: 덴마크)
            title: item.title,             // 소식 제목
            content: item.content,         // 상세 안전 내용
            wrtDt: item.wrtDt              // 작성일 (예: 2016-07-07)
        }));

        // (+) PostgreSQL 중복 에러 방지
        const uniqueData = [];      // 중복이 제거된 깨끗한 데이터만 담을 새 그릇
        const seenIds = new Set();  // 이미 검사한 ID들을 기록해둘 저장소

        for (const data of formattedData) {
            // 본 적 없는 새로운 id라면?
            if (!seenIds.has(data.id)) {
                seenIds.add(data.id);   // 기록지에 ID를 적어두고
                uniqueData.push(data);  // 새 그릇에 데이터를 안전하게 탑승시킵니다.
            }
            // 이미 본 적 있는 중복 id라면 아무것도 안 하고 그냥 패스합니다.
        }

        // (4) DB에 저장
        // 중복 방지 (id가 기본키)
        await SafetyInfo.bulkCreate(uniqueData, {
            // PostgreSQL의 ON CONFLICT(중복 충돌 제어) 처리를 위해 기본키 컬럼인 'id'를 conflictAttributes에 등록해 줍니다.
            conflictAttributes: ['id'],
            updateOnDuplicate: ['title', 'content', 'wrtDt']
        });

        console.log(`✅ 데이터 동기화 성공. 총 ${formattedData.length}건이 DB에 반영되었습니다.`);

    } catch (error) {
        console.error("❌ [에러 발생] 데이터 처리 중 문제가 생겼습니다:");
        console.error("에러 메시지:", error.message);
    }
};

module.exports = { fetchAndSaveSafetyData };