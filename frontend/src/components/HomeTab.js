import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { AlertTriangle, Map as MapIcon, List } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const koreaGeoUrl = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json";

const alertLevels = [
  { step: "1단계", label: "여행유의", bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb" },
  { step: "2단계", label: "여행자제", bg: "#fefce8", border: "#fef08a", text: "#ca8a04" },
  { step: "3단계", label: "출국권고", bg: "#fff7ed", border: "#fed7aa", text: "#ea580c" },
  { step: "4단계", label: "여행금지", bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
];

function HomeTab({
  subTab,
  viewMode,
  setViewMode,
  renderStats,
  overseasData,
  festivals,
}) {
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
        <div style={{ display: "flex", gap: "15px" }}>{renderStats()}</div>
      </div>

      {/* 2. 보기 모드 전환 버튼 토글 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "15px" }}>
        <button onClick={() => setViewMode("map")} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "none", backgroundColor: viewMode === "map" ? "white" : "transparent", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><MapIcon size={18} /> 지도 보기</button>
        <button onClick={() => setViewMode("list")} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "none", backgroundColor: viewMode === "list" ? "white" : "transparent", fontWeight: "800", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><List size={18} /> 목록 보기</button>
      </div>

      {/* 3. 메인 콘텐츠 영역 (지도, 목록) */}
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "30px", border: "1px solid #f1f5f9", marginBottom: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginBottom: "24px", fontWeight: "800", fontSize: "1.3rem", margin: "0 0 20px 0" }}>
          {subTab === "overseas" ? "세계 안전 지도" : "대한민국 축제 지도"}
        </h3>
        
        {viewMode === "map" ? (
          /* 지도 보기 모드 */
          <div style={{ height: "600px", backgroundColor: "#f8fafc", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <ComposableMap 
              projection={subTab === "domestic" ? "geoMercator" : "geoEqualEarth"} 
              projectionConfig={subTab === "domestic" ? { scale: 5500, center: [128, 36] } : { scale: 120, center: [0, 0] }}
            >
              <ZoomableGroup center={subTab === "domestic" ? [128, 36] : [0, 0]} zoom={1} minZoom={0.5} maxZoom={5}>
                <Geographies geography={subTab === "overseas" ? geoUrl : koreaGeoUrl}>
                  {({ geographies }) => geographies.map(geo => (
                    <Geography 
                      key={geo.rsmKey} 
                      geography={geo} 
                      fill={subTab === "overseas" ? "#DBEAFE" : "#d1fae5"} 
                      stroke={subTab === "overseas" ? "#3B82F6" : "#10b981"} 
                      strokeWidth={0.5} 
                      style={{ 
                        default: { outline: "none" }, 
                        hover: { fill: subTab === "overseas" ? "#93C5FD" : "#6ee7b7", outline: "none" } 
                      }} 
                    />
                  ))}
                </Geographies>
                
                {/* 국내 탭일 때 축제 마커 표시 */}
                {subTab === "domestic" && festivals.map(({ name, coordinates, color }) => (
                  <Marker key={name} coordinates={coordinates}>
                    <circle r={6} fill={color} stroke="#fff" strokeWidth={2} />
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        ) : (
          /* 목록 보기 모드 */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "15px", color: "#64748b" }}>지역/국가명</th>
                  <th style={{ padding: "15px", color: "#64748b" }}>{subTab === "overseas" ? "안전 등급" : "축제 시기"}</th>
                </tr>
              </thead>
              <tbody>
                {(subTab === "overseas" ? overseasData : festivals).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "18px", fontWeight: "700", color: "#1e293b" }}>{item.country || item.name}</td>
                    <td style={{ padding: "18px", fontWeight: "600", color: item.color || "#64748b" }}>{item.level || `${item.season} 축제`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. 해외 여행 시 하단 경보 안내 가이드 배너 */}
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