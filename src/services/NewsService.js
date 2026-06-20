/**
 * @file NewsService.js
 * @description Google News RSS 피드를 활용하여 국가별 안전 유의사항 및 재난 속보 데이터를 실시간 수집하는 서비스 레이어입니다.
 * 특정 이상 징후 키워드 조합 쿼리를 기반으로 데이터를 인제스천(Ingestion)하며, 불필요한 메타데이터 제거 후 영속성 계층에 적재합니다.
 */

const Parser = require('rss-parser');
const News = require('../models/News'); 

// RSS 파서 인스턴스 초기화
const parser = new Parser();

/**
 * 특정 국가의 위기 징후 및 안전/재난 관련 뉴스를 외부 RSS 엔드포인트에서 파싱하여 데이터베이스에 일괄 동기화합니다.
 * @param {string} countryName - 수집 대상 국가 명칭
 * @returns {Promise<void>}
 */
const fetchAndSaveNews = async (countryName) => {
    try {
        console.log(`[INFO] Google News RSS 수집 파이프라인 가동 - 대상 국가: ${countryName}`);

        // 1. 데이터 수집 기밀성 향상을 위한 검색 한정자 및 위기 징후 키워드 결합 쿼리 정의
        // 기사 제목 내 대상 국가명 필수 포함(intitle) 제약 및 주요 재난 이벤트 결합
        const searchQuery = `intitle:"${countryName}" (사고 OR 재난 OR 테러 OR 범죄 OR 지진 OR 전염병 OR 감염 OR 경보 OR 주의)`;
        
        // 2. 대한민국 언어 및 로케일 규격(ko-KR)을 준수하는 RSS 요청 엔드포인트 URL 생성
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=ko&gl=KR&ceid=KR:ko`;

        // 3. 원격 외부 자원 요청 핸들링 및 데이터 객체 변환 (Rss-Parser 활용)
        const feed = await parser.parseURL(url);
        const newsItems = feed.items;

        console.log(`[INFO] RSS 피드 파싱 성공 - [${countryName}] 수집 엔티티: 총 ${newsItems.length}건`);

        // 4. 원본 가공 필터링 및 영속성 레이어 매핑 규격에 맞춘 스키마 직렬화 (Serialization)
        const processedNews = newsItems.map(item => {
            // 구글 뉴스 특유의 제목 후미 언론사 식별자 메타 데이터 분리 및 HTML 태그 잔재 제거 필터링
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

        // 5. 관계형 데이터베이스 무결성 조건을 충족하는 배치 트랜잭션 수행
        if (processedNews.length > 0) {
            // 고유 식별 링크(link) 충돌 시 중복 적재를 방지하고 최신 데이터로 동기화(Upsert)하도록 제약 조건 명시
            await News.bulkCreate(processedNews, { 
                conflictAttributes: ['link'],
                updateOnDuplicate: ['title', 'description', 'pubDate']
            });
            console.log(`[SUCCESS] 영속성 계층 벌크 적재 완료 - [${countryName}] 처리 레코드 수: ${processedNews.length}건`);
            
            // 데이터 정상 정제 여부 검증을 위한 상위 레코드 디버그 미리보기 출력
            console.log(`\n[DEBUG] ${countryName} 실시간 동기화 데이터 검증 가시성 지표:`);
            processedNews.slice(0, 3).forEach((n, i) => console.log(`  ${i + 1}. ${n.title}`));
            console.log(`======================================================================\n`);
        } else {
            console.log(`[WARN] 검색 조건 만족 데이터 부재 - 최근 ${countryName} 관련 위기 요인 및 재난 속보 리소스가 존재하지 않습니다.`);
        }

    } catch (error) {
        console.error(`[ERROR] [${countryName}] Google News RSS 인제스천 처리 중 예외 발생:`, error.message);
    }
};

module.exports = { fetchAndSaveNews };