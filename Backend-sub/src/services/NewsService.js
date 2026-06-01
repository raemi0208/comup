/*
□ NewsService.js: API를 통해 뉴스 얻고 뉴스 필터링, DB에 저장
*/ 

const axios = require('axios');
const News = require('../models/News'); 
require('dotenv').config();

const fetchAndSaveNews = async (countryName) => {
    try {
        console.log(`🔍 [뉴스 검색 시작] 국가: ${countryName}`);
        // (강도 OR 감염 OR 경보 OR 범죄 OR 부상자 OR 사건 OR 사고 OR 소매치기 OR 전염병 OR 주의 OR 지진 OR 치안 OR 테러)

        // + 검색어 강화
        const query = encodeURIComponent(`${countryName} `);
        
        // (1) 네이버 API 호출
        const response = await axios.get('https://openapi.naver.com/v1/search/news.json', {
            params: { query: query, display: 20, sort: 'date' },
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
            }
        });

        // (2) API를 통해 얻어온 뉴스들 저장
        const newsItems = response.data.items;
        console.log(`📡 [네이버 응답] ${countryName} 관련 뉴스 총 ${newsItems.length}건 수신`);

        // (3) 데이터 가공 (필터링 없이 바로 정제만 진행)
        const processedNews = newsItems.map(item => ({
            link: item.link,
            countryName: countryName,
            title: item.title.replace(/<[^>]*>?/gm, ''),                // HTML 태그 제거
            description: item.description.replace(/<[^>]*>?/gm, ''),    // HTML 태그 제거
            pubDate: new Date(item.pubDate)                             // 날짜 형식 변환
        }));

        // (4) DB에 저장
        if (processedNews.length > 0) {
            // (5-1) bulkCreate를 이용하여 필터링된 뉴스를 DB에 업데이트 
            // updateOnDuplicate(뉴스 중복 없이)를 위해 News.js 에서 Link를 기본키로 설정함. 
            await News.bulkCreate(processedNews, { // [supabase 수정]
                conflictAttributes: ['link'],
                updateOnDuplicate: ['title', 'description', 'pubDate']
            });

            console.log(`✅ [저장 완료] ${countryName}의 위험 뉴스 ${processedNews.length}건이 DB에 반영되었습니다.`);
        } else {
            console.log(`⚠️ [필터링 통과 실패] ${countryName} 관련 뉴스 중 위험 키워드가 포함된 뉴스가 없습니다.`);
        }

    } catch (error) {
        console.error(`❌ [${countryName}] 뉴스 처리 중 에러 발생:`, error.message);
    }
};

module.exports = { fetchAndSaveNews };