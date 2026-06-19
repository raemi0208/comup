import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { FaPencilAlt, FaCamera, FaUserCircle, FaCheck, FaTimes, FaSignOutAlt } from "react-icons/fa"; // 로그아웃 아이콘 추가
import { Badge } from "./Badge";

// 리액트 라우터를 사용 중이시라면 useNavigate를 import 하세요.
// import { useNavigate } from "react-router-dom"; 

function MyPage({ user }) {
  const [profile, setProfile] = useState({ nickname: "", bio: "", avatar_url: "" });
  const [badges, setBadges] = useState([]);
  const [ownedBadgeIds, setOwnedBadgeIds] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // 1. 유저 정보 로드
    const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (userData) setProfile({ nickname: userData.nickname || "여행자", bio: userData.bio || "", avatar_url: userData.avatar_url });

    // 2. 전체 뱃지 및 보유 뱃지 로드
    const { data: allBadges } = await supabase.from("badges").select("*");
    const { data: userBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", user.id);

    setBadges(allBadges || []);
    setOwnedBadgeIds(userBadges?.map(ub => ub.badge_id) || []);
  };

  const handleProfileUpdate = async () => {
    await supabase.from("users").update({ nickname: profile.nickname, bio: profile.bio }).eq("id", user.id);
    setIsEditing(false);
    alert("프로필이 수정되었습니다.");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { data, error } = await supabase.storage.from("avatars").upload(`${user.id}/avatar.png`, file, { upsert: true });
    if (data) {
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      await supabase.from("users").update({ avatar_url: publicUrlData.publicUrl }).eq("id", user.id);
      setProfile({ ...profile, avatar_url: publicUrlData.publicUrl });
    }
  };

  // 로그아웃 처리 함수 추가
  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      // 1. 자체 백엔드(JWT) 토큰 삭제
      localStorage.removeItem("token");
      
      // 2. Supabase 세션도 사용 중이라면 함께 로그아웃 처리
      await supabase.auth.signOut();
      
      alert("로그아웃 되었습니다.");
      
      // 3. 페이지 이동 (리액트 라우터 방식 또는 기본 방식)
      window.location.href = "/"; // 메인 페이지나 로그인 페이지 경로로 변경하세요.
      // navigate("/"); 
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '50px' }}>로그인이 필요합니다.</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", position: "relative" }}>
      
      {/* 우측 상단 로그아웃 버튼 추가 */}
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
          <input type="file" onChange={handleAvatarChange} style={{ display: "none" }} />
        </label>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
            {isEditing ? (
              <input value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
            ) : (
              <h2 style={{ margin: 0, color: "#1e293b" }}>{profile.nickname}</h2>
            )}
            <button onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              {isEditing ? <FaCheck color="#2563eb" /> : <FaPencilAlt color="#94a3b8" />}
            </button>
            {isEditing && <button onClick={() => setIsEditing(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FaTimes color="#ef4444" /></button>}
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{user.email}</p>
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
        {badges.map((b) => (
          <div key={b.id} title={`${b.name} (${ownedBadgeIds.includes(b.id) ? '획득 완료' : '미획득'})`}>
            <Badge
              name={b.name}
              category={b.category}
              threshold={b.threshold}
              currentCount={ownedBadgeIds.includes(b.id) ? b.threshold : 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPage;