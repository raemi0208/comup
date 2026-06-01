import React from "react";
import { Newspaper } from "lucide-react";

const newsData = [
  { id: 1, type: "안전", country: "우크라이나", title: "우크라이나 전역 계속되는 긴장 상황", content: "동부 지역에서 군사 작전이 계속되고 있습니다. 모든 한국 국민의 출국을 권고합니다.", date: "2026-03-30", source: "Reuters", color: "#ef4444" },
  { id: 2, type: "안전", country: "프랑스", title: "파리 시내 대규모 시위 예정", content: "노동 개혁에 반대하는 시위가 예정되어 있습니다. 관광객들은 시위 지역을 피해주세요.", date: "2026-03-29", source: "Le Monde", color: "#ef4444" },
  { id: 3, type: "일반", country: "일본", title: "일본 도쿄, 봄 벚꽃 축제 개최", content: "도쿄 우에노 공원에서 벚꽃 축제가 시작되었습니다. 많은 관광객이 예상됩니다.", date: "2026-03-28", source: "NHK", color: "#3b82f6" },
  { id: 4, type: "재난", country: "태국", title: "태국, 우기 시즌 진입 예상", content: "4월부터 우기가 시작될 예정입니다. 홍수 위험 지역 확인이 필요합니다.", date: "2026-03-27", source: "Bangkok Post", color: "#f59e0b" },
];

function NewsTab({ newsCategory, setNewsCategory }) {
  return (
    <>
      {/* 뉴스 상단 배너 */}
      <div style={{ background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: "24px", padding: "40px", color: "white", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
          <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "12px" }}>
            <Newspaper size={32} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", margin: 0 }}>최신 여행 뉴스</h2>
        </div>
        <p style={{ opacity: 0.9, fontWeight: "500" }}>전 세계 여행 관련 최신 소식을 확인하세요</p>
      </div>

      {/* 카테고리 필터 버튼 탭 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "15px" }}>
        {["전체", "안전", "재난", "보건", "일반"].map((cat) => (
          <button
            key={cat}
            onClick={() => setNewsCategory(cat)}
            style={{
              flex: 1, padding: "12px", borderRadius: "10px", border: "none",
              backgroundColor: newsCategory === cat ? "white" : "transparent",
              fontWeight: "700", cursor: "pointer",
              boxShadow: newsCategory === cat ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 뉴스 카드 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {newsData
          .filter(news => newsCategory === "전체" || news.type === newsCategory)
          .map((news) => (
            <div key={news.id} style={{ backgroundColor: "white", borderRadius: "20px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ backgroundColor: `${news.color}15`, color: news.color, padding: "4px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "800" }}>{news.type}</span>
                  <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>{news.country}</span>
                </div>
                <div style={{ textAlign: "right", color: "#94a3b8", fontSize: "0.85rem" }}>
                  <div>🕒 {news.date}</div>
                  <div>{news.source}</div>
                </div>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>{news.title}</h3>
              <p style={{ color: "#64748b", lineHeight: "1.6", margin: 0 }}>{news.content}</p>
            </div>
          ))}
      </div>
    </>
  );
}

export default NewsTab;