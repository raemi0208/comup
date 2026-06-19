import React, { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { MapPin, Users, Navigation, Square, UserPlus, LogIn, X, Copy, Crown } from "lucide-react";
import { supabase } from "./supabaseClient";

// 백엔드 주소 (배포 환경 변수 혹은 로컬 테스트용 3000번 포트)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const koreaGeoUrl = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json";
const DEFAULT_CENTER = [127.0276, 37.4979];

function RoomLocationTab({ user, roomId: initialRoomId = null, roomTitle: initialRoomTitle = "우리들의 안전 여행 방" }) {
  // ---------- 방 상태 ----------
  // 상위 컴포넌트에서 강제로 넘겨받는 roomId가 있더라도, 사용자가 '처음 진입 시 무조건 생성/참여 창'으로 시작하길 원하므로 
  // 초기 상태값을 null로 설정하여 대문(모달)이 무조건 먼저 뜨도록 유도합니다.
  const [room, setRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(true); // 항상 무조건 대문 화면으로 시작
  const [modalTab, setModalTab] = useState("create"); // "create" (방 만들기) | "join" (참여하기)
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [roomActionError, setRoomActionError] = useState(null);
  
  // 백엔드 DB에서 받아온 방 코드를 저장할 상태
  const [createdRoomCode, setCreatedRoomCode] = useState(null);

  // ---------- 멤버 & 위치 상태 ----------
  const [members, setMembers] = useState([]);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [kickLoadingUserId, setKickLoadingUserId] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [otherUsers, setOtherUsers] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoadError, setInitialLoadError] = useState(null);
  const [wasKicked, setWasKicked] = useState(false);

  const watchIdRef = useRef(null);
  const mapCenter = myLocation ? [myLocation.lon, myLocation.lat] : DEFAULT_CENTER;

  const roomId = room?.id || null;
  const isHost = !!(room?.hostUserId && user?.id && String(room.hostUserId) === String(user.id));
  const myDisplayName = user?.nickname || user?.email?.split("@")[0] || "익명";

  // 만약 props로 initialRoomId가 넘어온 경우, 그것을 활용하여 즉시 대문을 패스하고 싶다면 아래 주석을 해제하세요.
  // 현재는 요구사항에 따라 무조건 대문 창이 뜨도록 위 상태값을 true / null 로 명시했습니다.
  /*
  useEffect(() => {
    if (initialRoomId) {
      setRoom({ id: initialRoomId, roomName: initialRoomTitle, hostUserId: null });
      setShowRoomModal(false);
    }
  }, [initialRoomId, initialRoomTitle]);
  */

  // =====================================================================
  // 백엔드 API 연동: 방 생성 로직 (DB에 저장 및 코드 발급)
  // =====================================================================
  const handleCreateRoom = async () => {
    if (!user?.id) {
      setRoomActionError("로그인 정보가 없습니다.");
      return;
    }
    setRoomActionLoading(true);
    setRoomActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: newRoomName.trim() || "우리들의 안전 여행 방",
          userId: user.id,
          userName: myDisplayName
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        setRoomActionError(data.message || "방 생성에 실패했습니다.");
        return;
      }
      
      // 생성 완료 시 백엔드 정보 세팅
      setRoom({
        id: data.data.id,
        roomName: data.data.roomName,
        hostUserId: data.data.hostUserId
      });
      setCreatedRoomCode(data.data.roomCode);
    } catch (error) {
      console.error("방 생성 요청 실패:", error);
      setRoomActionError("서버에 연결할 수 없습니다.");
    } finally {
      setRoomActionLoading(false);
    }
  };

  // =====================================================================
  // 백엔드 API 연동: 방 참여하기 로직
  // =====================================================================
  const handleJoinRoom = async () => {
    if (!user?.id) {
      setRoomActionError("로그인 정보가 없습니다.");
      return;
    }
    if (!joinCode.trim()) {
      setRoomActionError("참여 코드를 입력해 주세요.");
      return;
    }
    setRoomActionLoading(true);
    setRoomActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: joinCode.trim().toUpperCase(),
          userId: user.id,
          userName: myDisplayName
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        setRoomActionError(data.message || "코드를 확인해주세요. 입장에 실패했습니다.");
        return;
      }
      
      // 참여 성공 시 방 정보를 업데이트하고 모달을 닫아 지도를 보여줌
      setRoom({
        id: data.data.roomId,
        roomName: data.data.roomName,
        hostUserId: data.data.hostUserId
      });
      setWasKicked(false);
      setShowRoomModal(false);
    } catch (error) {
      console.error("방 입장 요청 실패:", error);
      setRoomActionError("서버에 연결할 수 없습니다.");
    } finally {
      setRoomActionLoading(false);
    }
  };

  // 클립보드 복사 유틸리티
  const handleCopyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard.writeText(createdRoomCode).catch(() => {});
    alert("코드가 복사되었습니다! 친구들에게 공유해주세요.");
  };

  // 방장 본인이 만든 방으로 바로 진입
  const handleEnterCreatedRoom = () => {
    setShowRoomModal(false);
    setCreatedRoomCode(null);
  };

  // 방 나가기(모달로 돌아가기)
  const handleLeaveRoomView = () => {
    if (isTracking && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setMyLocation(null);
    setOtherUsers({});
    setRoom(null);
    setModalTab("create");
    setNewRoomName("");
    setJoinCode("");
    setRoomActionError(null);
    setCreatedRoomCode(null);
    setShowRoomModal(true);
  };

  // =====================================================================
  // 멤버 실시간 조회 및 강퇴 로직
  // =====================================================================
  useEffect(() => {
    if (!roomId || showRoomModal) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members`);
        const data = await res.json();
        if (data.success) {
          setMembers(data.data);
          setRoom((prev) => (prev ? { ...prev, hostUserId: data.hostUserId } : prev));
        }
      } catch (error) {
        console.error("멤버 목록 조회 실패:", error);
      }
    };
    fetchMembers();
  }, [roomId, showRoomModal]);

  const handleKickMember = async (targetUserId) => {
    if (!roomId || !user?.id) return;
    setKickLoadingUserId(targetUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, targetUserId })
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => String(m.userId) !== String(targetUserId)));
        // Supabase 실시간 브로드캐스트 전송하여 실시간 퇴출 유도
        const kickChannel = supabase.channel(`room_${roomId}`, { config: { broadcast: { self: false } } });
        kickChannel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            kickChannel.send({ type: "broadcast", event: "member_kicked", payload: { targetUserId } });
            setTimeout(() => supabase.removeChannel(kickChannel), 500);
          }
        });
      } else {
        alert(data.message || "강퇴에 실패했습니다.");
      }
    } catch (error) {
      alert("서버에 연결할 수 없습니다.");
    } finally {
      setKickLoadingUserId(null);
    }
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;
    const channel = supabase.channel(`room_${roomId}_kick_listener`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "member_kicked" }, ({ payload }) => {
      if (String(payload.targetUserId) === String(user.id)) {
        setWasKicked(true);
      } else {
        setMembers((prev) => prev.filter((m) => String(m.userId) !== String(payload.targetUserId)));
      }
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!wasKicked) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setMyLocation(null);
    setOtherUsers({});
  }, [wasKicked]);

  // =====================================================================
  // 위치 공유 (백엔드 DB 동기화 + 소켓 브로드캐스팅)
  // =====================================================================
  const handleToggleSharing = () => {
    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      setMyLocation(null);
      return;
    }

    if (!navigator.geolocation) return alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");

    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        if (longitude && latitude) {
          setMyLocation({ lon: longitude, lat: latitude });
          setIsTracking(true);
        }
        setLoading(false);
      },
      (error) => {
        alert("위치 정보 권한을 승인해 주셔야 공유 기능이 작동합니다!");
        setLoading(false);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const syncLocationToBackend = async (lat, lon) => {
    if (!user?.id || !roomId) return;
    try {
      await fetch(`${API_BASE_URL}/api/rooms/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, roomId, latitude: lat, longitude: lon })
      });
    } catch (error) {
      console.error("위치 동기화 오류:", error);
    }
  };

  useEffect(() => {
    if (!roomId || showRoomModal) return;
    let isMounted = true;
    const fetchInitialLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/locations`);
        const data = await res.json();
        if (!isMounted) return;
        if (data.success) {
          const initial = {};
          data.data.forEach((member) => {
            if (String(member.userId) !== String(user?.id) && member.location) {
              initial[member.userId] = {
                lon: member.location.longitude,
                lat: member.location.latitude,
                userId: member.userId,
                userName: member.userName,
                updatedAt: new Date(member.location.updatedAt).toLocaleTimeString()
              };
            }
          });
          setOtherUsers(initial);
        } else {
          setInitialLoadError(data.message);
        }
      } catch (error) {
        setInitialLoadError("멤버 위치를 불러오지 못했습니다.");
      }
    };
    fetchInitialLocations();
    return () => { isMounted = false; };
  }, [roomId, showRoomModal, user?.id]);

  useEffect(() => {
    if (!user || !isTracking || !myLocation || !roomId) return;
    const channel = supabase.channel(`room_${roomId}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "location_update" }, ({ payload }) => {
      setOtherUsers((prev) => ({
        ...prev,
        [payload.userId]: {
          lon: payload.lon, lat: payload.lat, userId: payload.userId,
          userName: payload.userName, updatedAt: new Date().toLocaleTimeString()
        }
      }));
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast", event: "location_update",
          payload: { userId: user.id, userName: myDisplayName, lon: myLocation.lon, lat: myLocation.lat }
        });
      }
    });

    const interval = setInterval(() => {
      channel.send({
        type: "broadcast", event: "location_update",
        payload: { userId: user.id, userName: myDisplayName, lon: myLocation.lon, lat: myLocation.lat }
      });
      syncLocationToBackend(myLocation.lat, myLocation.lon);
    }, 5000);
    syncLocationToBackend(myLocation.lat, myLocation.lon);

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [isTracking, myLocation, roomId, user]);

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // =====================================================================
  // 렌더링 영역
  // =====================================================================
  if (wasKicked) {
    return (
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "60px 40px", textAlign: "center", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ef4444", marginBottom: "12px" }}>방장에 의해 강퇴되었습니다.</p>
        <button onClick={handleLeaveRoomView} style={{ padding: "12px 24px", borderRadius: "12px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}>
          다른 방 찾기
        </button>
      </div>
    );
  }

  // 1. 방을 만들거나 코드로 들어가는 대문(모달) 화면
  if (showRoomModal) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "white", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
          
          {!createdRoomCode ? (
            <>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={22} color="#2563eb" /> 위치 공유방
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 24px 0" }}>새 방을 만들거나, 친구가 보내준 코드로 입장하세요.</p>

              <div style={{ display: "flex", backgroundColor: "#f1f5f9", borderRadius: "14px", padding: "4px", marginBottom: "20px" }}>
                <button onClick={() => { setModalTab("create"); setRoomActionError(null); }} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", backgroundColor: modalTab === "create" ? "white" : "transparent", color: modalTab === "create" ? "#2563eb" : "#64748b", boxShadow: modalTab === "create" ? "0 2px 6px rgba(0,0,0,0.08)" : "none" }}>
                  방 만들기
                </button>
                <button onClick={() => { setModalTab("join"); setRoomActionError(null); }} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", backgroundColor: modalTab === "join" ? "white" : "transparent", color: modalTab === "join" ? "#2563eb" : "#64748b", boxShadow: modalTab === "join" ? "0 2px 6px rgba(0,0,0,0.08)" : "none" }}>
                  코드로 입장
                </button>
              </div>

              {modalTab === "create" ? (
                <>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px", display: "block" }}>방 이름</label>
                  <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="우리들의 안전 여행 방" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "0.9rem", marginBottom: "16px", boxSizing: "border-box" }} />
                  <button onClick={handleCreateRoom} disabled={roomActionLoading} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "800", fontSize: "0.95rem", cursor: roomActionLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <UserPlus size={18} /> {roomActionLoading ? "생성 중..." : "방 만들기"}
                  </button>
                </>
              ) : (
                <>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px", display: "block" }}>참여 코드 입력</label>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="초대 코드 6자리 (예: A1B2C3)" style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "0.9rem", marginBottom: "16px", letterSpacing: "2px", fontWeight: "700", boxSizing: "border-box" }} />
                  <button onClick={handleJoinRoom} disabled={roomActionLoading} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "800", fontSize: "0.95rem", cursor: roomActionLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <LogIn size={18} /> {roomActionLoading ? "입장 중..." : "참여하기"}
                  </button>
                </>
              )}
              {roomActionError && <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "14px", textAlign: "center" }}>⚠️ {roomActionError}</p>}
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "0 0 6px 0" }}>방이 생성되었어요!</h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 20px 0" }}>아래 코드를 복사해서 친구들에게 전달해주세요.</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
                <span style={{ flex: 1, fontSize: "1.6rem", fontWeight: "900", letterSpacing: "4px", color: "#065f46", textAlign: "center" }}>{createdRoomCode}</span>
                <button onClick={handleCopyCode} title="코드 복사" style={{ border: "none", backgroundColor: "white", borderRadius: "10px", padding: "10px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                  <Copy size={18} color="#10b981" />
                </button>
              </div>
              
              <button onClick={handleEnterCreatedRoom} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                 <LogIn size={18} /> 내 방 참여하기
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 2. 방 참여 완료 후 나타나는 실시간 지도 맵 화면
  return (
    <>
      <div style={{ background: isTracking ? "#10b981" : "#2563eb", borderRadius: "24px", padding: "40px", color: "white", marginBottom: "30px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={28} /> 동행인 실시간 위치 공유방
            </h2>
            <p style={{ opacity: 0.9, marginBottom: "0", fontWeight: "500", marginTop: "4px" }}>
              방 이름: {room?.roomName} {isHost && "👑 (내가 방장)"}
            </p>
          </div>
          <button onClick={handleLeaveRoomView} title="방 나가기" style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px", cursor: "pointer", color: "white", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "30px", flexWrap: "wrap" }}>
          <button onClick={handleToggleSharing} disabled={loading} style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: isTracking ? "#ef4444" : "white", color: isTracking ? "white" : "#2563eb", fontWeight: "800", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "all 0.2s ease" }}>
            {isTracking ? <Square size={20} /> : <MapPin size={20} />}
            {loading ? "GPS 탐색 중..." : isTracking ? "⏹️ 위치 공유 중지하기" : "내 위치 공유 시작하기"}
          </button>
          
          <button onClick={() => setShowMemberPanel((prev) => !prev)} style={{ padding: "16px 22px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.5)", backgroundColor: "transparent", color: "white", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} /> 방 멤버 관리
          </button>
        </div>
      </div>

      {showMemberPanel && (
        <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "24px", border: "1px solid #f1f5f9", marginBottom: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h4 style={{ margin: "0 0 16px 0", fontWeight: "800", fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color="#2563eb" /> 방에 참여중인 멤버 ({members.length}명)
          </h4>
          {members.map((member) => (
            <div key={member.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontWeight: "600", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                {String(member.userId) === String(room?.hostUserId) && <Crown size={14} color="#f59e0b" />}
                {member.userName}
                {String(member.userId) === String(user?.id) && <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>(나)</span>}
              </span>
              
              {isHost && String(member.userId) !== String(user?.id) && (
                <button onClick={() => handleKickMember(member.userId)} disabled={kickLoadingUserId === member.userId} style={{ border: "none", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>
                  {kickLoadingUserId === member.userId ? "처리 중..." : "강퇴하기"}
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>멤버 정보를 불러오는 중입니다...</p>}
        </div>
      )}

      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "30px", border: "1px solid #f1f5f9", marginBottom: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginBottom: "24px", fontWeight: "800", fontSize: "1.3rem", margin: "0 0 20px 0" }}>실시간 위치 맵</h3>
        {initialLoadError && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "16px" }}>⚠️ {initialLoadError}</p>}
        
        <div style={{ height: "550px", backgroundColor: "#f8fafc", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 5500, center: mapCenter }}>
            <ZoomableGroup center={mapCenter} zoom={1}>
              <Geographies geography={koreaGeoUrl}>
                {({ geographies }) => geographies.map(geo => (
                  <Geography key={geo.rsmKey} geography={geo} fill="#d1fae5" stroke="#10b981" strokeWidth={0.5} style={{ default: { outline: "none" } }} />
                ))}
              </Geographies>

              {myLocation && (
                <Marker coordinates={[myLocation.lon, myLocation.lat]}>
                  <g transform="translate(-10, -20)">
                    <path d="M10 20S3 12 3 8.5a7 7 0 1 1 14 0c0 3.5-7 11-7 11zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#10b981" stroke="#fff" strokeWidth={1} />
                  </g>
                  <text textAnchor="middle" y={14} style={{ fontSize: "10px", fontWeight: "900", fill: "#065f46" }}>나 ({myDisplayName})</text>
                </Marker>
              )}

              {Object.values(otherUsers).map((peer) => (
                <Marker key={peer.userId} coordinates={[peer.lon, peer.lat]}>
                  <g transform="translate(-10, -20)">
                    <path d="M10 20S3 12 3 8.5a7 7 0 1 1 14 0c0 3.5-7 11-7 11zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#2563eb" stroke="#fff" strokeWidth={1} />
                  </g>
                  <text textAnchor="middle" y={14} style={{ fontSize: "10px", fontWeight: "800", fill: "#1e3a8a" }}>{peer.userName}</text>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>

          <div style={{ position: "absolute", bottom: "20px", right: "20px", backgroundColor: "rgba(255, 255, 255, 0.95)", padding: "18px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", width: "240px", backdropFilter: "blur(4px)" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <Navigation size={14} color="#2563eb" /> 위치 공유중인 멤버
            </h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.8rem", color: "#475569" }}>
              <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                <span style={{ color: "#10b981" }}>● 나 ({myDisplayName})</span>
                <span style={{ color: "#94a3b8" }}>{isTracking ? "공유중" : "오프라인"}</span>
              </div>
              {Object.values(otherUsers).map((peer) => (
                <div key={peer.userId} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600" }}>● {peer.userName}</span>
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{peer.updatedAt}</span>
                </div>
              ))}
              {Object.keys(otherUsers).length === 0 && <p style={{ color: "#94a3b8", margin: "10px 0 0 0", fontStyle: "italic", fontSize: "0.75rem" }}>방에 아직 다른 멤버가 없습니다.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoomLocationTab;