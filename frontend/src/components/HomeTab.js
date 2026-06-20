/**
 * @file HomeTab.js
 * @description 여행 안전 정보 및 국내 축제 데이터를 관리하는 메인 대시보드 컴포넌트입니다.
 * Supabase를 통해 실시간 데이터를 동기화하며, react-simple-maps를 활용한 지리적 시각화 모드와
 * 데이터 목록 뷰 모드를 조건부 렌더링으로 제공합니다.
 */

import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { AlertTriangle, Map as MapIcon, List, RotateCw } from "lucide-react";
import { supabase } from './supabaseClient';
import iso from "iso-3166-1"; 

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const koreaGeoUrl = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json";

/**
 * @constant alertLevels 여행경보 단계별 UI 스타일 정의
 */
const alertLevels = [
  { step: "1단계", label: "여행유의", bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb" },
  { step: "2단계", label: "여행자제", bg: "#fefce8", border: "#fef08a", text: "#ca8a04" },
  { step: "3단계", label: "출국권고", bg: "#fff7ed", border: "#fed7aa", text: "#ea580c" },
  { step: "4단계", label: "여행금지", bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
];

/**
 * @constant LEVEL_MAPPER 안전 등급별 텍스트 및 컬러 매핑
 */
const LEVEL_MAPPER = {
  1: { text: "1단계", color: "#2563eb" },
  2: { text: "2단계", color: "#ca8a04" },
  3: { text: "3단계", color: "#ea580c" },
  4: { text: "4단계", color: "#dc2626" },
};

function HomeTab({ subTab, viewMode, setViewMode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  /**
   * @description Supabase 데이터베이스로부터 국가 안전 정보 및 축제 리스트를 인제스천합니다.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const table = subTab === "overseas" ? "country_safety_status" : "festivals";
      const { data: dbData, error } = await supabase
        .from(table)
        .select("*");
      if (error) {
        console.error("데이터 로드 실패:", error);
      } else {
        setData(dbData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [subTab, refreshTrigger]);

  /**
   * @description 수동 새로고침 이벤트를 발생시키는 트리거 토글 함수입니다.
   */
  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  /**
   * @description ISO alpha-2 코드를 지도 데이터 매칭을 위한 numeric 코드로 변환하여 컬러 맵을 생성합니다.
   */
  const countryColorMap = useMemo(() => {
    const map = {};
    if (subTab !== "overseas") return map;

    data.forEach((item) => {
      if (!item.country_iso_alp2) return;
      const isoInfo = iso.whereAlpha2(item.country_iso_alp2);
      if (!isoInfo) return;

      const levelInfo = LEVEL_MAPPER[Number(item.level_id)];
      map[isoInfo.numeric] = levelInfo ? levelInfo.color : "#cbd5e1";
    });

    return map;
  }, [data, subTab]);

  return (
    <>
      {/* 1. 상단 통계 배너 */}
      <div style={{ background: subTab === "overseas" ? "#2563eb" : "#10b981", borderRadius: "24px", padding: "40px", color: "white", marginBottom: "30px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", margin: 0 }}>
          {subTab === "overseas" ? "안전한 여행을 위한 가이드" : "대한민국 축제 정보"}
        </h2>
        <p style={{ opacity: 0.9, marginBottom: "30px", fontWeight: "500", marginTop: "4px" }}>
          {subTab === "overseas" ? "외교부 공공 데이터 기반 실시간 국가별 안전 정보를 확인하세요" : "전국 각지에서 열리는 다양한 축제를 확인하고 계획하세요"}
        </p>

        <div style={{ display: "flex", gap: "15px" }}>
          {subTab === "overseas" ? (
            [1, 2, 3, 4].map((levelId, i) => {
              const labels = ["여행유의", "여행자제", "출국권고", "여행금지"];
              const count = data.filter(d => {
                const lvl = d.level_id || d.safety_level || d.level;
                return Number(lvl) === levelId || String(lvl).includes(String(levelId));
              }).length;
              return (
                <div key={levelId} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", padding: "20px", borderRadius: "16px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{count}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{labels[i]}</div>
                </div>
              );
            })
          ) : (
            ["봄", "여름", "가을", "겨울"].map(s => {
              const count = data.filter(f => (f.season || f['시즌'] || "") === s).length;
              return (
                <div key={s} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", padding: "20px", borderRadius: "16px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{count}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{s} 축제</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. 보기 모드 전환 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "15px" }}>
        <button onClick={() => setViewMode("map")} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "none", backgroundColor: viewMode === "map" ? "white" : "transparent", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><MapIcon size={18} /> 지도 보기</button>
        <button onClick={() => setViewMode("list")} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "none", backgroundColor: viewMode === "list" ? "white" : "transparent", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><List size={18} /> 목록 보기</button>
      </div>

      {/* 3. 메인 콘텐츠 */}
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "30px", border: "1px solid #f1f5f9", marginBottom: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontWeight: "800", fontSize: "1.3rem", margin: 0 }}>
            {subTab === "overseas" ? "세계 안전 지도" : "대한민국 축제 지도"}
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              backgroundColor: "white",
              fontWeight: "700",
              color: "#475569",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <RotateCw size={15} style={{ transform: loading ? "rotate(360deg)" : "none", transition: "transform 0.5s ease" }} />
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", fontWeight: "600", color: "#64748b" }}>데이터를 불러오는 중...</div>
        ) : viewMode === "map" ? (
          <div style={{ height: "600px", backgroundColor: "#f8fafc", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <ComposableMap
              projection={subTab === "domestic" ? "geoMercator" : "geoEqualEarth"}
              projectionConfig={subTab === "domestic" ? { scale: 5500, center: [128, 36] } : { scale: 120, center: [0, 0] }}
            >
              <ZoomableGroup center={subTab === "domestic" ? [128, 36] : [0, 0]} zoom={1}>
                <Geographies geography={subTab === "overseas" ? geoUrl : koreaGeoUrl}>
                  {({ geographies }) => geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={
                        subTab === "overseas"
                          ? (countryColorMap[geo.id] || "#e2e8f0")
                          : "#d1fae5"
                      }
                      stroke={subTab === "overseas" ? "#94a3b8" : "#10b981"}
                      strokeWidth={0.5}
                    />
                  ))}
                </Geographies>
                {subTab === "domestic" && data.map((item) => {
                  const lon = parseFloat(item['경도'] || item.lon || item.longitude);
                  const lat = parseFloat(item['위도'] || item.lat || item.latitude);
                  if (isNaN(lon) || isNaN(lat)) return null;
                  return (
                    <Marker key={item.id} coordinates={[lon, lat]}>
                      <circle r={6} fill={item.color || "#10b981"} stroke="#fff" strokeWidth={2} />
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "15px", color: "#64748b" }}>지역/국가명</th>
                  <th style={{ padding: "15px", color: "#64748b" }}>{subTab === "overseas" ? "안전 등급" : "축제 시기"}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const countryName = item.country_name;
                  const rawLevel = item.level_id || item.safety_level || item.level;

                  const safetyInfo = LEVEL_MAPPER[Number(rawLevel)] || {
                    text: rawLevel || "정보 없음",
                    color: "#64748b"
                  };

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "18px", fontWeight: "700", color: "#1e293b" }}>
                        {subTab === "overseas"
                          ? (countryName || "이름 없는 국가")
                          : (item['축제명'] || item.name || "이름 없는 축제")}
                      </td>
                      <td style={{ padding: "18px", fontWeight: "600", color: subTab === "overseas" ? safetyInfo.color : "#10b981" }}>
                        {subTab === "overseas"
                          ? safetyInfo.text
                          : `${item.season || item['시즌'] || '기타'} 축제`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {subTab === "overseas" && (
        <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "30px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <AlertTriangle size={22} color="#ea580c" />
            <h3 style={{ fontWeight: "800", margin: 0, fontSize: "1.2rem" }}>여행경보 단계 안내</h3>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            {alertLevels.map((lvl, i) => (
              <div key={i} style={{ flex: 1, padding: "24px 15px", borderRadius: "16px", backgroundColor: lvl.bg, border: `1px solid ${lvl.border}`, textAlign: "center" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", color: lvl.text, marginBottom: "4px" }}>{lvl.step}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: lvl.text }}>{lvl.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
export default HomeTab;