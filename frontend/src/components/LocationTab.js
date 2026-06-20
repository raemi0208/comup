/**
 * @file LocationTab.js
 * @description 사용자의 현재 위치를 실시간으로 공유하고, 방 단위의 멤버 위치를 지도상에 시각화하는 컴포넌트입니다.
 * 주요 기능: 방 생성/참여, 실시간 GPS 위치 전송, 멤버 관리 및 지도 마커 렌더링.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { MapPin, Users, Navigation, Square, UserPlus, LogIn, X, Copy, Crown } from "lucide-react";
import { supabase } from "./supabaseClient";

// 백엔드 주소 (배포 환경 변수 혹은 로컬 테스트용 3000번 포트)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const koreaGeoUrl = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-topo-simple.json";
const DEFAULT_CENTER = [127.0276, 37.4979];

// 방 정보를 새로고침/탭 이동/재로그인 후에도 유지하기 위한 localStorage 키
// 사용자별로 분리해야 "로그아웃 후 다른 계정으로 로그인"했을 때 남의 방 정보가 섞이지 않음.
const ROOM_STORAGE_KEY_PREFIX = "travelOffice_roomInfo_";
const getRoomStorageKey = (userId) => `${ROOM_STORAGE_KEY_PREFIX}${userId}`;

const saveRoomToStorage = (userId, room) => {
  if (!userId) return;
  try {
    localStorage.setItem(getRoomStorageKey(userId), JSON.stringify(room));
  } catch (error) {
    console.error("방 정보 로컬 저장 실패:", error);
  }
};

const loadRoomFromStorage = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getRoomStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("방 정보 로컬 불러오기 실패:", error);
    return null;
  }
};

const clearRoomFromStorage = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(getRoomStorageKey(userId));
  } catch (error) {
    console.error("방 정보 로컬 삭제 실패:", error);
  }
};

function RoomLocationTab({ user, roomId: initialRoomId = null, roomTitle: initialRoomTitle = "우리들의 안전 여행 방" }) {
  // ---------- 방 상태 ----------
  // 처음엔 무조건 null/true(대문 화면)로 시작하던 것을, "복구 시도 중" 상태를 거치도록 변경.
  // restoreStatus: "checking" (서버에 내 방이 있는지 확인 중) -> "restored" (복구 완료) | "none" (복구할 방 없음, 대문 노출)
  const [room, setRoom] = useState(null);
  const [restoreStatus, setRestoreStatus] = useState("checking");
  const [showRoomModal, setShowRoomModal] = useState(false); // 복구 확인이 끝나기 전까지는 모달도, 지도도 보여주지 않음.
  const [modalTab, setModalTab] = useState("create"); // "create" (방 만들기) | "join" (참여하기)
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [roomActionError, setRoomActionError] = useState(null);

  // 백엔드 DB에서 받아온 방 코드를 저장할 상태 (방 생성 완료 화면용)
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
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const watchIdRef = useRef(null);
  const mapCenter = myLocation ? [myLocation.lon, myLocation.lat] : DEFAULT_CENTER;

  const roomId = room?.id || null;
  const roomCode = room?.roomCode || null; // 방 안에서도 상시 노출할 코드
  const isHost = !!(room?.hostUserId && user?.id && String(room.hostUserId) === String(user.id));
  const myDisplayName = user?.nickname || user?.email?.split("@")[0] || "익명";

  // =====================================================================
  // 새로고침 / 탭 이동 후 복귀 / 재로그인 시: 내가 있던 방을 서버에 확인 후 자동 복귀
  // =====================================================================
  useEffect(() => {
    let isMounted = true;

    const restoreRoom = async () => {
      if (!user?.id) {
        if (isMounted) {
          setRestoreStatus("none");
          setShowRoomModal(true);
        }
        return;
      }

      const savedRoom = loadRoomFromStorage(user.id);
      if (!savedRoom?.id) {
        if (isMounted) {
          setRestoreStatus("none");
          setShowRoomModal(true);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${savedRoom.id}/me?userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          // 서버에도 내가 여전히 이 방의 멤버로 남아있음 -> 지도 화면으로 바로 복귀
          setRoom({
            id: data.data.roomId,
            roomName: data.data.roomName,
            roomCode: data.data.roomCode,
            hostUserId: data.data.hostUserId
          });
          saveRoomToStorage(user.id, {
            id: data.data.roomId,
            roomName: data.data.roomName,
            roomCode: data.data.roomCode,
            hostUserId: data.data.hostUserId
          });
          setShowRoomModal(false);
          setRestoreStatus("restored");
        } else {
          // 방이 만료되었거나, 강퇴되었거나, 더 이상 멤버가 아님 -> 로컬 기록 정리하고 대문으로
          clearRoomFromStorage(user.id);
          setRestoreStatus("none");
          setShowRoomModal(true);
        }
      } catch (error) {
        console.error("방 복구 확인 실패:", error);
        // 서버 연결이 잠깐 안 되는 상황일 수 있으니, 로컬 기록은 지우지 않고 대문만 보여줌
        if (isMounted) {
          setRestoreStatus("none");
          setShowRoomModal(true);
        }
      }
    };

    restoreRoom();
    return () => { isMounted = false; };
    // user?.id가 바뀔 때(로그인/로그아웃/계정 전환)마다 다시 복구 시도
  }, [user?.id]);

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

      const newRoomInfo = {
        id: data.data.id,
        roomName: data.data.roomName,
        roomCode: data.data.roomCode,
        hostUserId: data.data.hostUserId
      };

      // 생성 완료 시 백엔드 정보 세팅
      setRoom(newRoomInfo);
      setCreatedRoomCode(data.data.roomCode);
      // 방 정보를 로컬에 저장해 새로고침/탭 이동/재로그인에도 유지되도록 함.
      saveRoomToStorage(user.id, newRoomInfo);
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

      const joinedRoomInfo = {
        id: data.data.roomId,
        roomName: data.data.roomName,
        roomCode: data.data.roomCode,
        hostUserId: data.data.hostUserId
      };

      // 참여 성공 시 방 정보를 업데이트하고 모달을 닫아 지도를 보여줌.
      setRoom(joinedRoomInfo);
      setWasKicked(false);
      setShowRoomModal(false);
      // 방 정보를 로컬에 저장해 새로고침/탭 이동/재로그인에도 유지되도록 함.
      saveRoomToStorage(user.id, joinedRoomInfo);
    } catch (error) {
      console.error("방 입장 요청 실패:", error);
      setRoomActionError("서버에 연결할 수 없습니다.");
    } finally {
      setRoomActionLoading(false);
    }
  };

  // 클립보드 복사 유틸리티 (방 생성 완료 화면용).
  const handleCopyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard.writeText(createdRoomCode).catch(() => {});
    alert("코드가 복사되었습니다! 친구들에게 공유해주세요.");
  };

  // 방 안 헤더에서 코드 복사 (토스트성 피드백으로 alert 대신 버튼 텍스트 변경 사용).
  const handleCopyRoomCodeInline = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  // 방장 본인이 만든 방으로 바로 진입.
  const handleEnterCreatedRoom = () => {
    setShowRoomModal(false);
    setCreatedRoomCode(null);
  };

  // 로컬 상태만 비우는 헬퍼 (강퇴당했을 때 / 서버 호출 후 정리 공통 사용).
  const resetLocalRoomState = useCallback(() => {
    if (isTracking && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setMyLocation(null);
    setOtherUsers({});
    setMembers([]);
    setShowMemberPanel(false);
    setRoom(null);
    setModalTab("create");
    setNewRoomName("");
    setJoinCode("");
    setRoomActionError(null);
    setCreatedRoomCode(null);
    setShowRoomModal(true);
  }, [isTracking]);

  // 방 나가기: 이제 서버에도 명확히 "나가기"를 알려서 DB의 멤버십을 제거.
  const handleLeaveRoomView = async () => {
    if (!roomId || !user?.id) {
      resetLocalRoomState();
      return;
    }

    const confirmed = window.confirm(
      isHost
        ? "방장이 나가면 이 방은 모든 멤버와 함께 종료됩니다. 정말 나가시겠습니까?"
        : "방을 나가시겠습니까? 다시 입장하려면 코드가 필요합니다."
    );
    if (!confirmed) return;

    setLeaveLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "방을 나가는 중 문제가 발생했습니다.");
        return;
      }
    } catch (error) {
      console.error("방 나가기 요청 실패:", error);
      // 서버 연결이 안 되더라도, 사용자가 명시적으로 나가기를 눌렀으므로 로컬은 정리.
    } finally {
      setLeaveLoading(false);
    }

    clearRoomFromStorage(user.id);
    resetLocalRoomState();
  };

  // =====================================================================
  // 멤버 실시간 조회 및 강퇴 로직
  // 한 번만 불러오던 것을 짧은 주기로 polling하여, 다른 사용자가 들어왔을 때도
  // 내 화면에 자동으로 반영되도록 변경.
  // =====================================================================
  useEffect(() => {
    if (!roomId || showRoomModal) return;

    let isMounted = true;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members`);
        const data = await res.json();
        if (!isMounted) return;
        if (data.success) {
          setMembers(data.data);
          setRoom((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, hostUserId: data.hostUserId };
            // roomCode가 응답에 있다면(생성 시점에 못 받았거나 최신화) 같이 갱신.
            if (data.roomCode) updated.roomCode = data.roomCode;
            if (data.roomName) updated.roomName = data.roomName;
            return updated;
          });
        }
      } catch (error) {
        console.error("멤버 목록 조회 실패:", error);
      }
    };

    fetchMembers(); // 즉시 1회 실행.
    const intervalId = setInterval(fetchMembers, 5000); // 5초마다 멤버 목록 갱신 -> 새 참가자 반영

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
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
        // Supabase 실시간 브로드캐스트 전송하여 실시간 퇴출 유도.
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
    if (!wasKicked || !user?.id) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setMyLocation(null);
    setOtherUsers({});
    // 강퇴당했을 때도 로컬에 남아있는 방 복귀 정보를 정리해야,
    // 다음에 들어왔을 때 다시 자동으로 그 방에 복귀를 시도하지 않음.
    clearRoomFromStorage(user.id);
  }, [wasKicked, user?.id]);

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

  const syncLocationToBackend = useCallback(async (lat, lon) => {
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
  }, [user, roomId]);

  // DB에서 받아온 멤버 전체 위치를 다시 가져오는 로직을 함수로 분리하고,
  // polling으로도 호출하여 broadcast를 놓쳤을 때의 백업 경로로 사용.
  useEffect(() => {
    if (!roomId || showRoomModal) return;
    let isMounted = true;

    const fetchAllLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/locations`);
        const data = await res.json();
        if (!isMounted) return;
        if (data.success) {
          setOtherUsers((prev) => {
            const next = { ...prev };
            data.data.forEach((member) => {
              if (String(member.userId) !== String(user?.id) && member.location) {
                next[member.userId] = {
                  lon: member.location.longitude,
                  lat: member.location.latitude,
                  userId: member.userId,
                  userName: member.userName,
                  updatedAt: new Date(member.location.updatedAt).toLocaleTimeString()
                };
              }
            });
            return next;
          });
        } else {
          setInitialLoadError(data.message);
        }
      } catch (error) {
        setInitialLoadError("멤버 위치를 불러오지 못했습니다.");
      }
    };

    fetchAllLocations(); // 진입 시 즉시 1회.
    // 10초마다 백업으로 한 번씩 DB와 동기화 (실시간 broadcast를 놓친 경우 보완).
    const intervalId = setInterval(fetchAllLocations, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
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
  }, [isTracking, myLocation, roomId, user, myDisplayName, syncLocationToBackend]);

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // =====================================================================
  // 렌더링 영역
  // =====================================================================

  // 0. 서버에 내 방이 있는지 확인하는 동안 보여줄 로딩 화면
  //    (이 화면이 없으면 복구 중에도 잠깐 대문 모달이 깜빡이며 보일 수 있음.)
  if (restoreStatus === "checking") {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 16px", color: "#94a3b8", fontSize: "0.9rem" }}>
        참여 중인 방을 확인하고 있어요...
      </div>
    );
  }

  if (wasKicked) {
    return (
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "60px 40px", textAlign: "center", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ef4444", marginBottom: "12px" }}>방장에 의해 강퇴되었습니다.</p>
        <button onClick={() => { setWasKicked(false); resetLocalRoomState(); }} style={{ padding: "12px 24px", borderRadius: "12px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}>
          다른 방 찾기
        </button>
      </div>
    );
  }

  // 1. 방을 만들거나 코드로 들어가는 대문(모달) 화면.
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

  // 2. 방 참여 완료 후 나타나는 실시간 지도 맵 화면.
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

            {/* 방 안에서도 참여 코드를 상시 노출 + 복사 버튼 */}
            {roomCode && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "14px", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: "12px", padding: "8px 12px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", opacity: 0.85 }}>참여 코드</span>
                <span style={{ fontSize: "1rem", fontWeight: "900", letterSpacing: "3px" }}>{roomCode}</span>
                <button
                  onClick={handleCopyRoomCodeInline}
                  title="코드 복사"
                  style={{
                    border: "none",
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.72rem",
                    fontWeight: "700"
                  }}
                >
                  <Copy size={14} />
                  {codeCopied ? "복사됨!" : "복사"}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleLeaveRoomView}
            title="방 나가기"
            disabled={leaveLoading}
            style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px 12px", cursor: leaveLoading ? "not-allowed" : "pointer", color: "white", flexShrink: 0, display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "0.85rem" }}
          >
            <X size={18} /> {leaveLoading ? "처리 중..." : "방 나가기"}
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