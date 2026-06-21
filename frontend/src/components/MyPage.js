/**
 * @file MyPage.js
 * @description 사용자 프로필 관리, 통계 확인, 뱃지 컬렉션을 조회 및 수정하는 마이페이지 컴포넌트입니다.
 * 주요 기능: 프로필 정보(닉네임, 자기소개, 아바타) 수정, 회원 활동 통계 표시, 활동 데이터 기반의 뱃지 획득 현황 관리.
 */

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { FaPencilAlt, FaCamera, FaUserCircle, FaCheck, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { Badge } from "./Badge";

// 백엔드 주소 (배포 환경 변수 혹은 로컬 테스트용 3000번 포트)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// 이 앱은 Supabase Auth가 아니라 자체 JWT 인증을 사용합니다.
// 로그인 시 authController.js가 발급한 토큰이 localStorage("token")에 저장되어 있고,
// 마이페이지 관련 모든 API는 이 토큰을 Authorization 헤더로 보내야 인증을 통과합니다.
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// 리액트 라우터를 사용 중이시라면 useNavigate를 import 하세요.
// import { useNavigate } from "react-router-dom"; 

function MyPage({ user }) {
  const [profile, setProfile] = useState({ nickname: "", bio: "", avatar_url: "", email: "" });
  const [counts, setCounts] = useState({ attendance_count: 0, post_count: 0, landmark_count: 0, friend_count: 0 });
  const [badges, setBadges] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // =====================================================================
  // Supabase의 "users"(소문자, Auth 연동용) 테이블을 직접 조회하던 방식에서,
  // 백엔드 API(GET /api/mypage)를 호출하는 방식으로 변경했습니다.
  // 이유: 실제 회원가입 데이터는 public."Users"(대문자, 자체 JWT 인증)에 저장되고,
  // Supabase의 "users"(소문자)는 그와 무관한 별개 테이블이라 항상 비어 있었습니다.
  // =====================================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mypage`, { headers: getAuthHeaders() });
      const data = await res.json();

      if (!data.success) {
        setLoadError(data.message || "마이페이지 정보를 불러오지 못했습니다.");
        return;
      }

      setProfile({
        nickname: data.data.nickname || "여행자",
        bio: data.data.bio || "",
        avatar_url: data.data.avatar_url || "",
        email: data.data.email || user?.email || ""
      });
      setCounts(data.data.counts || {});
      setBadges(data.data.badges || []);
    } catch (error) {
      console.error("마이페이지 조회 실패:", error);
      setLoadError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  // 닉네임/자기소개 수정 시 백엔드 PUT /api/mypage 호출 -> DB(Users.nickname, user_stats.bio) 갱신
  const handleProfileUpdate = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mypage`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ nickname: profile.nickname, bio: profile.bio })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "프로필 수정에 실패했습니다.");
        return;
      }
      setIsEditing(false);
      alert("프로필이 수정되었습니다.");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("서버에 연결할 수 없습니다.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 아바타 이미지 자체는 Supabase Storage에 그대로 업로드하고(파일 저장은 Storage가 더 적합),
  // 완성된 public URL만 백엔드에 보내 user_stats.avatar_url에 저장합니다.
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;

    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/avatar.png`, file, { upsert: true });

      if (error) {
        console.error("아바타 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다.");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      const avatarUrl = publicUrlData.publicUrl;

      const res = await fetch(`${API_BASE_URL}/api/mypage/avatar`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatarUrl })
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || "프로필 사진 저장에 실패했습니다.");
        return;
      }

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
    } catch (error) {
      console.error("아바타 변경 실패:", error);
      alert("서버에 연결할 수 없습니다.");
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      // 1. 자체 백엔드(JWT) 토큰 삭제
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 2. Supabase 세션도 사용 중이라면 함께 로그아웃 처리 (예: 아바타 업로드용 Storage 접근)
      await supabase.auth.signOut();

      alert("로그아웃 되었습니다.");

      // 3. 페이지 이동 (리액트 라우터 방식 또는 기본 방식)
      window.location.href = "/"; // 메인 페이지나 로그인 페이지 경로로 변경하세요.
      // navigate("/"); 
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>로그인이 필요합니다.</div>;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>마이페이지를 불러오는 중입니다...</div>;
  }

  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: "#ef4444", marginBottom: "16px" }}>⚠️ {loadError}</p>
        <button onClick={fetchData} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "700", cursor: "pointer" }}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", position: "relative" }}>

      {/* 우측 상단 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        style={{ position: "absolute", top: "30px", right: "30px", background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem", fontWeight: "600" }}
      >
        <FaSignOutAlt /> 로그아웃
      </button>

      {/* 프로필 섹션 */}
      <div style={{ display: "flex", alignItems: "center", gap: "25px", marginBottom: "30px", marginTop: "10px" }}>
        <label style={{ cursor: "pointer", position: "relative" }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="profile" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
          ) : (
            <FaUserCircle size={90} color="#cbd5e1" />
          )}
          <div style={{ position: "absolute", bottom: 0, right: 0, background: "#f8fafc", padding: "8px", borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <FaCamera size={14} color="#64748b" />
          </div>
          <input type="file" onChange={handleAvatarChange} style={{ display: "none" }} accept="image/*" />
        </label>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
            {isEditing ? (
              <input value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            ) : (
              <h2 style={{ margin: 0, color: "#1e293b" }}>{profile.nickname}</h2>
            )}
            <button onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))} disabled={savingProfile} style={{ background: "none", border: "none", cursor: savingProfile ? "not-allowed" : "pointer" }}>
              {isEditing ? <FaCheck color="#2563eb" /> : <FaPencilAlt color="#94a3b8" />}
            </button>
            {isEditing && (
              <button onClick={() => setIsEditing(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <FaTimes color="#ef4444" />
              </button>
            )}
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{profile.email}</p>
        </div>
      </div>

      {/* 자기소개 섹션 */}
      <div style={{ marginBottom: "40px" }}>
        <label style={{ fontWeight: "700", display: "block", marginBottom: "10px", color: "#334155" }}>자기소개</label>
        {isEditing ? (
          <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", minHeight: "80px", resize: "none" }} />
        ) : (
          <div style={{ padding: "15px", border: "1px solid #f1f5f9", borderRadius: "12px", backgroundColor: "#f8fafc", color: "#475569", minHeight: "50px" }}>
            {profile.bio || "자기소개가 아직 없습니다."}
          </div>
        )}
      </div>

      {/* 뱃지 섹션 */}
      <h3 style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", color: "#1e293b" }}>내 뱃지 컬렉션</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginTop: "20px" }}>
        {badges.map((b) => {
          // 💡 카테고리별로 현재 유저의 누적 카운트를 가져와서 threshold와 비교합니다.
          // category: 'attendance' | 'post' | 'landmark' | 'friend'
          const countKey = `${b.category}_count`;
          const currentCount = counts[countKey] ?? 0;
          const achieved = currentCount >= b.threshold;

          return (
            <div key={b.id} title={`${b.name} (${achieved ? "획득 완료" : "미획득"}) - ${currentCount}/${b.threshold}`}>
              <Badge
                name={b.name}
                category={b.category}
                threshold={b.threshold}
                currentCount={currentCount}
              />
            </div>
          );
        })}
        {badges.length === 0 && (
          <p style={{ color: "#94a3b8", gridColumn: "1 / -1", fontStyle: "italic" }}>뱃지 정보를 불러오는 중입니다...</p>
        )}
      </div>
    </div>
  );
}

export default MyPage;
