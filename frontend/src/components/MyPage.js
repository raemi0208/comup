import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function MyPage({ user }) {
  const [myPostsCount, setMyPostsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // 유저가 작성한 데이터 통계 가져오기 예시
    const fetchMyStats = async () => {
      const { count, error } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author", user.email); // 본인 작성 글 필터링 (필요시 설계에 맞게 변경)

      if (!error) setMyPostsCount(count || 0);
    };

    fetchMyStats();
  }, [user]);

  // 로그아웃 함수
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("로그아웃 중 오류가 발생했습니다.");
    else alert("로그아웃 되었습니다.");
  };

  if (!user) return <div style={{ padding: "40px", textAlign: "center", fontWeight: "700" }}>로그인이 필요한 서비스입니다.</div>;

  return (
    <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "40px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
      {/* 프로필 상단 */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", borderBottom: "1px solid #f1f5f9", paddingBottom: "24px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
          👤
        </div>
        <div>
          <h2 style={{ margin: 0, fontWeight: "900", color: "#1e293b", fontSize: "1.5rem" }}>내 프로필</h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontWeight: "600" }}>{user.email}</p>
        </div>
      </div>

      {/* 활동 통계 정보 대시보드 */}
      <h3 style={{ fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>나의 활동 내역</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#2563eb", marginBottom: "4px" }}>{myPostsCount}</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "700" }}>작성한 후기</div>
        </div>
        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#10b981", marginBottom: "4px" }}>가입완료</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "700" }}>계정 상태</div>
        </div>
      </div>

      {/* 로그아웃 버튼 */}
      <button 
        onClick={handleLogout}
        style={{ width: "100%", padding: "14px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", transition: "background 0.2s" }}
      >
        로그아웃
      </button>
    </div>
  );
}

export default MyPage;