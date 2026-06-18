import React, { useState, useEffect } from "react";
import { Newspaper } from "lucide-react";
import { supabase } from './supabaseClient';

// 카테고리별 컬러 매핑
const TYPE_COLORS = {
  "안전": "#ef4444",
  "재난": "#f59e0b",
  "보건": "#10b981",
  "일반": "#3b82f6"
};

function NewsTab({ newsCategory, setNewsCategory }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. 뉴스 데이터 Fetching 함수
 const fetchNews = async () => {
    setLoading(true);
    
    const { data, error } = await supabase.from('News').select('*');

    if (error) {
      console.error("뉴스 데이터를 가져오는 중 오류 발생:", error);
      setNews([]);
    } else {
      if (newsCategory === "전체") {
        setNews(data || []);
      } else {
        const filtered = data.filter(item => {
          if (newsCategory === "일반") {
            return item.type === "일반" || !item.type; 
          }
          return item.type === newsCategory;
        });
        setNews(filtered);
      }
    }
    setLoading(false);
  };

  // 2. 카테고리 변경 시마다 데이터 새로고침
  useEffect(() => {
    fetchNews();
  }, [newsCategory]);

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
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: "700" }}>불러오는 중...</div>
      ) : news.length === 0 ? (
        /* [예외 처리 추가] 뉴스가 아예 없을 때 화면이 텅 비어 보이지 않게 처리 */
        <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8", fontWeight: "600", backgroundColor: "#f8fafc", borderRadius: "20px", border: "1px dashed #e2e8f0" }}>
          등록된 최신 뉴스가 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {news.map((item) => (
            <div key={item.id} style={{ backgroundColor: "white", borderRadius: "20px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{
                    backgroundColor: `${TYPE_COLORS[item.type] || "#64748b"}15`,
                    color: TYPE_COLORS[item.type] || "#64748b",
                    padding: "4px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "800"
                  }}>{item.type || "일반"}</span>
                  <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>{item.country || "글로벌"}</span>
                </div>
                <div style={{ textAlign: "right", color: "#94a3b8", fontSize: "0.85rem" }}>
                  <div>{item.date || item.created_at || "날짜 정보 없음"}</div>
                  <div>{item.source || "출처 미상"}</div>
                </div>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>{item.title || "제목 없음"}</h3>
              <p style={{ color: "#64748b", lineHeight: "1.6", margin: 0 }}>{item.content || "내용이 존재하지 않습니다."}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default NewsTab;