/*
□ SafetyLevelService.js: 외교부 API -> country_safety_status 테이블로 저장 (중복 제거 완화 버전)
*/ 


const axios = require('axios');
const CountrySafetyStatus = require('../models/CountrySafetyStatus'); 
require('dotenv').config();

const fetchAndSaveSafetyStatusData = async () => {
    try {
        console.log(`🌍 [외교부 API] 국가별 여행경보 데이터 수집 시작...`);

        const url = 'https://apis.data.go.kr/1262000/TravelAlarmService2/getTravelAlarmList2';
        
        const response = await axios.get(url, {
            params: {
                serviceKey: process.env.SERVICE_KEY,
                returnType: 'JSON',
                numOfRows: 200, 
                pageNo: 1
            }
        });

        const itemsData = response.data.response?.body?.items;
        const items = Array.isArray(itemsData) ? itemsData : (itemsData?.item || []);

        console.log(`📡 [외교부 응답] 총 ${items.length}개 국가 데이터 수신`);

        // ★ [핵심 수정] 중복 국가 처리를 위한 Map 그릇 생성
        const safetyRecordsMap = new Map();

        for (const item of items) {
            if (!item.country_nm) continue; // 국가명이 없는 빈 데이터는 패스

            let levelId = null;
            if (item.alarm_lvl) {
                const levels = item.alarm_lvl.match(/\d/g); 
                if (levels && levels.length > 0) {
                    levelId = parseInt(levels[0], 10); 
                }
            }

            // 중복 처리 로직
            if (safetyRecordsMap.has(item.country_nm)) {
                // 이미 동일한 국가가 맵에 등록되어 있다면?
                const existingRecord = safetyRecordsMap.get(item.country_nm);
                
                // 더 높은 경보 단계(위험도가 더 높은 상태)가 있다면 그걸로 업데이트해 둡니다.
                if (levelId > existingRecord.level_id) {
                    safetyRecordsMap.set(item.country_nm, {
                        country_name: item.country_nm,
                        level_id: levelId
                    });
                }
            } else {
                // 처음 보는 국가라면 맵에 신규 등록
                safetyRecordsMap.set(item.country_nm, {
                    country_name: item.country_nm,
                    level_id: levelId
                });
            }
        }

        // Map에 담긴 고유한 국가 데이터들을 다시 배열형태로 추출합니다.
        const safetyRecords = Array.from(safetyRecordsMap.values());
        console.log(`🧹 [데이터 정제] 중복 국가 제거 완료 후 최종 반영 대상: ${safetyRecords.length}건`);

        // DB에 저장
        if (safetyRecords.length > 0) {
            await CountrySafetyStatus.bulkCreate(safetyRecords, {
                conflictAttributes: ['country_name'], 
                updateOnDuplicate: ['level_id', 'updated_at'] 
            });
            console.log(`✅ [저장 완료] 여행경보 데이터 ${safetyRecords.length}건 DB 반영 완료`);
        } else {
            console.log(`⚠️ [결과 없음] 외교부 API에서 읽어온 데이터가 없습니다.`);
        }

    } catch (error) {
        console.error(`❌ [외교부 API] 데이터 처리 중 에러 발생:`, error.message);
    }
};

module.exports = { fetchAndSaveSafetyStatusData };