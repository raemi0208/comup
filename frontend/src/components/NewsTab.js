/**
 * @file NewsTab.js
 * @description Supabase News 테이블에서 여행 관련 최신 소식을 가져와 카테고리별로 분류하고, 
 * 검색어 하이라이트 기능을 통해 사용자에게 뉴스 리스트를 제공.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Newspaper, Search, X } from "lucide-react";
import { supabase } from './supabaseClient';

// 카테고리별 컬러 매핑
const TYPE_COLORS = {
  "안전": "#ef4444",
  "재난": "#f59e0b",
  "보건": "#10b981",
  "일반": "#3b82f6"
};

// pubDate 포맷 함수: "2026-03-24 07:00:00.000 +00:00" → "2026.03.24"
function formatDate(pubDate) {
  if (!pubDate) return "날짜 정보 없음";
  try {
    const date = new Date(pubDate);
    if (isNaN(date.getTime())) return "날짜 정보 없음";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  } catch {
    return "날짜 정보 없음";
  }
}

// 검색어를 포함한 텍스트에 하이라이트 적용
function HighlightText({ text, keyword }) {
  if (!keyword || !text) return <>{text || ""}</>;
  const parts = text.split(new RegExp(`(${keyword})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: "#fef08a", color: "#1e293b", borderRadius: "2px", padding: "0 1px" }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function NewsTab({ newsCategory, setNewsCategory }) {
  const [allNews, setAllNews] = useState([]);   // DB에서 받아온 전체 원본 데이터
  const [news, setNews] = useState([]);          // 필터링 후 실제 렌더링할 데이터
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  // 1. DB에서 전체 뉴스 Fetch (마운트 시 1회만)
  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('News')
      .select('*')
      .order('pubDate', { ascending: false });

    if (error) {
      console.error("뉴스 데이터를 가져오는 중 오류 발생:", error);
      setAllNews([]);
    } else {
      setAllNews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // 2. 카테고리 or 검색어 변경 시 클라이언트 사이드 필터링
  const applyFilter = useCallback(() => {
    let filtered = allNews;

    // 카테고리 필터
    if (newsCategory !== "전체") {
      filtered = filtered.filter(item => {
        if (newsCategory === "일반") return item.type === "일반" || !item.type;
        return item.type === newsCategory;
      });
    }

    // 키워드 검색 필터 (title, description, countryName 대상)
    if (searchQuery.trim()) {
      const kw = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.title || "").toLowerCase().includes(kw) ||
        (item.description || "").toLowerCase().includes(kw) ||
        (item.countryName || "").toLowerCase().includes(kw)
      );
    }

    setNews(filtered);
  }, [allNews, newsCategory, searchQuery]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // 3. 검색 실행 (엔터 or 버튼)
  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  // 4. 검색어 초기화
  const handleClear = () => {
    setInputValue("");
    setSearchQuery("");
  };

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

      {/* 검색창 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={18}
            color="#94a3b8"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            type="text"
            placeholder="제목, 내용, 국가명으로 검색..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              width: "100%",
              padding: "13px 44px 13px 42px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#1e293b",
              outline: "none",
              boxSizing: "border-box",
              backgroundColor: "white",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          {inputValue && (
            <button
              onClick={handleClear}
              style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: "2px",
                display: "flex", alignItems: "center"
              }}
            >
              <X size={16} color="#94a3b8" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "13px 22px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "0.95rem",
            whiteSpace: "nowrap"
          }}
        >
          검색
        </button>
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

      {/* 검색 결과 건수 표시 */}
      {searchQuery && !loading && (
        <div style={{ marginBottom: "14px", color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
          <span style={{ color: "#8b5cf6", fontWeight: "800" }}>"{searchQuery}"</span> 검색 결과&nbsp;
          <span style={{ color: "#1e293b", fontWeight: "800" }}>{news.length}건</span>
        </div>
      )}

      {/* 뉴스 카드 리스트 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: "700" }}>불러오는 중...</div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8", fontWeight: "600", backgroundColor: "#f8fafc", borderRadius: "20px", border: "1px dashed #e2e8f0" }}>
          {searchQuery ? `"${searchQuery}"에 해당하는 뉴스가 없습니다.` : "등록된 최신 뉴스가 없습니다."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {news.map((item) => (
            <div
              key={item.id}
              style={{ backgroundColor: "white", borderRadius: "20px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
            >
              {/* 상단: 타입 태그 + 국가명 / 날짜 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{
                    backgroundColor: `${TYPE_COLORS[item.type] || "#64748b"}15`,
                    color: TYPE_COLORS[item.type] || "#64748b",
                    padding: "4px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "800"
                  }}>{item.type || "일반"}</span>
                  <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
                    <HighlightText text={item.countryName || "글로벌"} keyword={searchQuery} />
                  </span>
                </div>
                <div style={{ textAlign: "right", color: "#94a3b8", fontSize: "0.85rem" }}>
                  <div>{formatDate(item.pubDate)}</div>
                </div>
              </div>

              {/* 제목 (클릭 시 원본 URL 이동 + 하이라이트) */}
              <h3
                onClick={() => item.link && window.open(item.link, "_blank", "noopener,noreferrer")}
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: item.link ? "#2563eb" : "#1e293b",
                  marginBottom: "8px",
                  cursor: item.link ? "pointer" : "default",
                  textDecoration: item.link ? "underline" : "none",
                  textUnderlineOffset: "3px",
                  lineHeight: "1.4"
                }}
              >
                <HighlightText text={item.title || "제목 없음"} keyword={searchQuery} />
              </h3>

              {/* 본문 요약 (하이라이트) */}
              <p style={{ color: "#64748b", lineHeight: "1.6", margin: 0, fontSize: "0.9rem" }}>
                <HighlightText text={item.description || "내용이 존재하지 않습니다."} keyword={searchQuery} />
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default NewsTab;