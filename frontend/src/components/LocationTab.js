import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { MapPin, Users, Navigation } from "lucide-react";
import { supabase } from "./supabaseClient";

// 대한민국 행정구역 지도 JSON 데이터 (기존 프로젝트와 통일)
const koreaGeoUrl = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json";

// 기본 중심점: 서울 (내 위치를 찾기 전까지 지도가 정상적으로 뜨도록 하얀 화면 방지용)
const DEFAULT_CENTER = [127.0276, 37.4979];

function RoomLocationTab({ user, roomId = "우리들의 안전 여행 방" }) {
  // 1. 상태(State) 정의
  const [myLocation, setMyLocation] = useState(null); // 내 실제 위치 { lon, lat }
  const [otherUsers, setOtherUsers] = useState({});   // 방에 있는 다른 유저들 위치 정보
  const [isTracking, setIsTracking] = useState(false); // 위치 공유가 켜져 있는지 여부
  const [loading, setLoading] = useState(false);

  // 지도의 중심점을 잡아주는 변수 (내 위치가 없으면 기본 서울로 설정하여 크래시 방지)
  const mapCenter = myLocation ? [myLocation.lon, myLocation.lat] : DEFAULT_CENTER;

  // 2. 브라우저 GPS API를 통해 내 실제 위치 가져오기
  const handleStartSharing = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        if (longitude && latitude) {
          setMyLocation({ lon: longitude, lat: latitude });
          setIsTracking(true);
        }
        setLoading(false);
      },
      (error) => {
        console.error("위치 가져오기 오류:", error);
        alert("위치 정보 권한을 승인해 주셔야 공유 기능이 작동합니다!");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 3. Supabase Realtime (Broadcast) 연동 - 같은 방 유저와 실시간 좌표 송수신
  useEffect(() => {
    // 필수 데이터가 없거나, 내 위치 공유를 시작하지 않았다면 실시간 연결 안 함
    if (!user || !isTracking || !myLocation) return;

    // 💡 Supabase 채널 개설 (방 고유 ID를 기준으로 방 분리)
    const channel = supabase.channel(`room_${roomId}`, {
      config: { broadcast: { self: false } } // 내가 보낸 신호는 내가 다시 받지 않음
    });

    // 📡 수신 핸들러: 다른 유저가 내뿜는 위치 정보를 실시간으로 받아서 상태 업데이트
    channel
      .on("broadcast", { event: "location_update" }, ({ payload }) => {
        setOtherUsers((prev) => ({
          ...prev,
          [payload.email]: {
            lon: payload.lon,
            lat: payload.lat,
            email: payload.email,
            updatedAt: new Date().toLocaleTimeString()
          }
        }));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // 채널 방에 성공적으로 입장하자마자 내 현재 위치를 다른 유저들에게 쏴줌
          channel.send({
            type: "broadcast",
            event: "location_update",
            payload: { email: user.email, lon: myLocation.lon, lat: myLocation.lat }
          });
        }
      });

    // 내 위치가 주기적으로 변경되거나 컴포넌트가 유지될 때 브로드캐스트 지속 전송
    const interval = setInterval(() => {
      channel.send({
        type: "broadcast",
        event: "location_update",
        payload: { email: user.email, lon: myLocation.lon, lat: myLocation.lat }
      });
    }, 5000); // 5초마다 내 위치를 방 유저들에게 갱신

    // 컴포넌트가 꺼질 때(Unmount) 구독을 끊어서 과부하 방지
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isTracking, myLocation, roomId, user]);

  return (
    <>
      {/* 1. 상단 인트로 대시보드 배너 */}
      <div style={{ background: "#2563eb", borderRadius: "24px", padding: "40px", color: "white", marginBottom: "30px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <Users size={28} /> 동행인 실시간 위치 공유방
        </h2>
        <p style={{ opacity: 0.9, marginBottom: "30px", fontWeight: "500", marginTop: "4px" }}>
          같은 방(`{roomId}`)의 멤버들과 지도 위에서 서로의 실시간 위치를 확인해 보세요.
        </p>
        
        {/* 위치 연동 작동 버튼 */}
        <button
          onClick={handleStartSharing}
          disabled={loading}
          style={{
            padding: "16px 28px",
            borderRadius: "16px",
            border: "none",
            backgroundColor: isTracking ? "#10b981" : "white",
            color: isTracking ? "white" : "#2563eb",
            fontWeight: "800",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease"
          }}
        >
          <MapPin size={20} />
          {loading ? "GPS 신호 탐색 중..." : isTracking ? "📍 우리 팀에게 내 위치 공유 중" : "내 위치 공유 시작하기"}
        </button>
      </div>

      {/* 2. 메인 콘텐츠 (지도 및 리스트 레이아웃) */}
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "30px", border: "1px solid #f1f5f9", marginBottom: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginBottom: "24px", fontWeight: "800", fontSize: "1.3rem", margin: "0 0 20px 0" }}>
          실시간 위치 맵
        </h3>

        {/* 지도판 컨테이너 */}
        <div style={{ height: "550px", backgroundColor: "#f8fafc", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 5500, center: mapCenter }}
          >
            <ZoomableGroup center={mapCenter} zoom={1}>
              <Geographies geography={koreaGeoUrl}>
                {({ geographies }) => geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#d1fae5" // 기존 국내 탭 연두색 톤 유지
                    stroke="#10b981"
                    strokeWidth={0.5}
                    style={{ default: { outline: "none" } }}
                  />
                ))}
              </Geographies>

              {/* 💡 [나의 마커] - 초록색 핀 */}
              {myLocation && (
                <Marker coordinates={[myLocation.lon, myLocation.lat]}>
                  <g transform="translate(-10, -20)">
                    <path d="M10 20S3 12 3 8.5a7 7 0 1 1 14 0c0 3.5-7 11-7 11zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#10b981" stroke="#fff" strokeWidth={1} />
                  </g>
                  <text textAnchor="middle" y={14} style={{ fontSize: "10px", fontWeight: "900", fill: "#065f46" }}>
                    나 ({user?.email ? user.email.split("@")[0] : "익명"})
                  </text>
                </Marker>
              )}

              {/* 💡 [방 멤버들의 마커] - 파란색 핀 */}
              {Object.values(otherUsers).map((peer) => (
                <Marker key={peer.email} coordinates={[peer.lon, peer.lat]}>
                  <g transform="translate(-10, -20)">
                    <path d="M10 20S3 12 3 8.5a7 7 0 1 1 14 0c0 3.5-7 11-7 11zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#2563eb" stroke="#fff" strokeWidth={1} />
                  </g>
                  <text textAnchor="middle" y={14} style={{ fontSize: "10px", fontWeight: "800", fill: "#1e3a8a" }}>
                    {peer.email.split("@")[0]}
                  </text>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>

          {/* 지도 위 우측 하단 미니 상황판 Overlay */}
          <div style={{ position: "absolute", bottom: "20px", right: "20px", backgroundColor: "rgba(255, 255, 255, 0.95)", padding: "18px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", width: "240px", backdropFilter: "blur(4px)" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <Navigation size={14} color="#2563eb" /> 실시간 참여 멤버 목록
            </h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.8rem", color: "#475569" }}>
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                <span style={{ color: "#10b981" }}>● 나 ({user?.email?.split("@")[0] || "미로그인"})</span>
                <span style={{ color: "#94a3b8" }}>{isTracking ? "공유중" : "오프라인"}</span>
              </div>
              {Object.values(otherUsers).map((peer) => (
                <div key={peer.email} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600" }}>● {peer.email.split("@")[0]}</span>
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{peer.updatedAt}</span>
                </div>
              ))}
              {Object.keys(otherUsers).length === 0 && (
                <p style={{ color: "#94a3b8", margin: "10px 0 0 0", fontStyle: "italic", fontSize: "0.75rem" }}>방에 아직 다른 멤버가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoomLocationTab;