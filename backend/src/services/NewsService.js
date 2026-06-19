/*
□ NewsService.js: 구글 뉴스 RSS를 이용한 국가별 안전/재난 뉴스 수집
*/ 

const Parser = require('rss-parser');
const News = require('../models/News'); 

// RSS 파서 객체 생성
const parser = new Parser();

const fetchAndSaveNews = async (countryName) => {
    try {
        console.log(`🔍 [뉴스 검색 시작] 국가: ${countryName} (Google News RSS)`);

        // 1. 구글 맞춤형 강력한 검색 쿼리 작성
        // intitle:"일본" -> 기사 제목에 무조건 '일본'이 들어가야 함!
        // (사고 OR 재난 OR 테러...) -> 이 중 하나라도 기사에 포함되어야 함!
        const searchQuery = `intitle:"${countryName}" (사고 OR 재난 OR 테러 OR 범죄 OR 지진 OR 전염병 OR 감염 OR 경보 OR 주의)`;
        
        // 2. 구글 뉴스 RSS 주소 생성 (한국어, 한국 지역 설정 포함)
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=ko&gl=KR&ceid=KR:ko`;

        // 3. RSS 데이터 가져오기 및 파싱 (axios 대신 parser 사용)
        const feed = await parser.parseURL(url);
        const newsItems = feed.items;

        console.log(`📡 [구글 응답] ${countryName} 관련 1차 검색 결과: 총 ${newsItems.length}건`);

        // 4. 데이터 정제 (구글은 이미 정확하므로 복잡한 필터링 생략)
        const processedNews = newsItems.map(item => {
            // 구글 뉴스는 제목 뒤에 ' - 언론사명'이 붙는 경우가 많아 이를 깔끔하게 제거
            const cleanTitle = item.title.split(' - ')[0].replace(/<[^>]*>?/gm, '').trim();
            const cleanDescription = (item.contentSnippet || item.content || '').replace(/<[^>]*>?/gm, '').trim();

            return {
                link: item.link,
                countryName: countryName,
                title: cleanTitle,       
                description: cleanDescription, 
                pubDate: new Date(item.pubDate)                     
            };
        });

        // 5. DB에 저장
        if (processedNews.length > 0) {
            await News.bulkCreate(processedNews, { 
                conflictAttributes: ['link'],
                updateOnDuplicate: ['title', 'description', 'pubDate']
            });
            console.log(`✅ [저장 완료] ${countryName} 안전/재난 뉴스 ${processedNews.length}건 DB 반영 완료`);
            
            // [확인용] 저장된 뉴스 제목 3개만 미리보기
            console.log(`\n🧐 [${countryName}] 수집된 뉴스 미리보기:`);
            processedNews.slice(0, 3).forEach((n, i) => console.log(`  ${i + 1}. ${n.title}`));
            console.log(`------------------------------------------------------\n`);
        } else {
            console.log(`⚠️ [결과 없음] 최근 ${countryName} 관련 중대한 안전/재난 뉴스가 없습니다.`);
        }

    } catch (error) {
        console.error(`❌ [${countryName}] 구글 뉴스 처리 중 에러 발생:`, error.message);
    }
};

module.exports = { fetchAndSaveNews };