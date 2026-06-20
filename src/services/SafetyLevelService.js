/**
 * @file SafetyLevelService.js
 * @description 대한민국 공공데이터포털(외교부 여행경보 API)에서 제공하는 국가별 실시간 위험도 데이터를 파싱하여 
 * 시스템 마스터 테이블(country_safety_status)에 일괄 동기화하는 영속성 인제스천 서비스 레이어입니다.
 * 동일 국가 내 다중 경보 발령 시 최고 위험도 단계를 우선 보존하는 최적화 정제 알고리즘을 포함합니다.
 */

const axios = require('axios');
const CountrySafetyStatus = require('../models/CountrySafetyStatus'); 
require('dotenv').config();

/**
 * 외교부 오픈 API 엔드포인트로부터 최신 여행경보 원격 자원을 수집하고 데이터 단일화 정제 후 벌크 업서트(Upsert)를 수행합니다.
 * @returns {Promise<void>}
 */
const fetchAndSaveSafetyStatusData = async () => {
    try {
        console.log(`[INFO] 외교부 공공데이터 포털 국가별 여행경보 API 동기화 프로세스 가동`);

        const url = 'https://apis.data.go.kr/1262000/TravelAlarmService2/getTravelAlarmList2';
        
        // 외교부 국가별 여행경보 단기 발령 및 기본 경보 리스트 요청 바인딩
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

        console.log(`[INFO] 원격 API 응답 수신 완료 - 원본 세그먼트 개수: ${items.length}건`);

        // 국가 단위의 고유 엔티티 격리 및 지역별 다중 발령 통합 처리를 위한 인메모리 수집용 Map 인스턴스 생성
        const safetyRecordsMap = new Map();

        for (const item of items) {
            // 무결성 검증: 필수 식별자인 국가 명칭(country_nm) 부재 시 해당 컬렉션 요소 제외
            if (!item.country_nm) continue; 

            let levelId = null;
            // 발령 등급 메타데이터 문자열에서 정규식을 활용해 정수형 핵심 위험 등급 식별자 파싱
            if (item.alarm_lvl) {
                const levels = item.alarm_lvl.match(/\d/g); 
                if (levels && levels.length > 0) {
                    levelId = parseInt(levels[0], 10); 
                }
            }

            // 고유 국가 식별자 기준 데이터 병합 및 정제 로직 수행
            if (safetyRecordsMap.has(item.country_nm)) {
                // 기등록된 국가 엔티티가 존재하는 경우 데이터 최악 시나리오 편향 원칙에 의거해 위험도 비교 수용
                const existingRecord = safetyRecordsMap.get(item.country_nm);
                
                // 특정 국가 내 지역별 편차 등으로 상이한 경보가 다중 발령된 경우 최상위 위험 등급(Max Level) 기준으로 오버라이트 처리
                if (levelId > existingRecord.level_id) {
                    safetyRecordsMap.set(item.country_nm, {
                        country_name: item.country_nm,
                        level_id: levelId,
                        country_iso_alp2: item.country_iso_alp2 || null
                    });
                }
            } else {
                // 수집 파이프라인 내 미등록 상태인 고유 국가 엔티티인 경우 최초 매핑 등록
                safetyRecordsMap.set(item.country_nm, {
                    country_name: item.country_nm,
                    level_id: levelId,
                    country_iso_alp2: item.country_iso_alp2 || null
                });
            }
        }

        // 배치 적재 최적화를 위해 중복 제거가 완료된 고유 국가 컬렉션을 배열 구조로 변환
        const safetyRecords = Array.from(safetyRecordsMap.values());
        console.log(`[INFO] 데이터 정제 파이프라인 완료 - 최종 영속성 반영 대상 레코드: ${safetyRecords.length}건`);

        // 데이터 트랜잭션 수행 및 일괄 영속화 처리
        if (safetyRecords.length > 0) {
            // 고유 식별 명칭(country_name) 충돌 제약을 기반으로 데이터 덮어쓰기(Upsert) 멱등성 보장
            await CountrySafetyStatus.bulkCreate(safetyRecords, {
                conflictAttributes: ['country_name'], 
                updateOnDuplicate: ['level_id', 'country_iso_alp2', 'updated_at'] 
            });
            console.log(`[SUCCESS] 여행경보 실시간 스냅샷 데이터베이스 동기화 완료 - 처리 건수: ${safetyRecords.length}건`);
        } else {
            console.log(`[WARN] 데이터 적재 스킵 - 외교부 수신 응답 스트림 내 유효 데이터 엔티티가 존재하지 않습니다.`);
        }

    } catch (error) {
        console.error(`[ERROR] 외교부 공공 데이터 인제스천 및 런타임 제어 중 예외 핸들러 트리거:`, error.message);
    }
};

module.exports = { fetchAndSaveSafetyStatusData };