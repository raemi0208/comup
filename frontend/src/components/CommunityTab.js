import React from "react";
import { Users } from "lucide-react";

function CommunityTab({
  posts,
  setPosts,
  searchQuery,
  setSearchQuery,
  isModalOpen,
  setIsModalOpen,
  newPost,
  setNewPost,
}) {
  return (
    <>
      {/* 상단 타이틀 및 후기 작성 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ color: "#2563eb", display: "flex", alignItems: "center" }}>
              <Users size={28} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", margin: 0, color: "#1e293b" }}>안전 커뮤니티</h2>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontWeight: "600" }}>실제 여행자들의 생생한 안전 정보를 공유해요</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: "#0f172a", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>+</span> 후기 작성
        </button>
      </div>

      {/* 검색 및 정렬 필터 바 */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "30px" }}>
        <input 
          type="text" 
          placeholder="🔍 후기 검색..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontWeight: "600", fontSize: "0.95rem" }}
        />
        <select style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontWeight: "600", color: "#64748b", outline: "none", cursor: "pointer" }}>
          <option>🧭 최신순</option>
          <option>추천순</option>
        </select>
      </div>

      {/* 대시보드 통계 카드 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {[
          { label: "전체 후기", value: posts.length.toString(), color: "#2563eb" },
          { label: "총 좋아요", value: posts.reduce((acc, p) => acc + (p.likes || 0), 0).toString(), color: "#16a34a" },
          { label: "총 댓글", value: posts.reduce((acc, p) => acc + (p.comments || 0), 0).toString(), color: "#9333ea" }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: "white", border: "1px solid #f1f5f9", borderRadius: "20px", padding: "24px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
            <div style={{ fontSize: "2rem", fontWeight: "900", color: stat.color, marginBottom: "4px" }}>{stat.value}</div>
            <div style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: "700" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 후기 피드 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {posts
          .filter(post => post.title.includes(searchQuery) || post.content.includes(searchQuery) || post.country.includes(searchQuery))
          .map((post) => (
            <div key={post.id} style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#cbd5e1", overflow: "hidden" }}>
                    <img src={`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontWeight: "800", color: "#1e293b" }}>{post.author}</span>
                      <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", fontSize: "0.8" + "rem", fontWeight: "700" }}>{post.country}</span>
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{post.date}</span>
                  </div>
                </div>
                <div style={{ color: "#eab308", fontWeight: "700" }}>{"⭐".repeat(post.rating)}</div>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", marginBottom: "10px" }}>{post.title}</h3>
              <p style={{ color: "#475569", lineHeight: "1.6", margin: "0 0 16px 0", fontWeight: "500", whiteSpace: "pre-wrap" }}>{post.content}</p>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {post.tags ? post.tags.map((tag, idx) => (
                  <span key={idx} style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700" }}>{tag}</span>
                )) : (
                  <>
                    <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700" }}>#여행후기</span>
                    <span style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700" }}>#{post.country}</span>
                  </>
                )}
              </div>
              
              <div style={{ display: "flex", gap: "16px", color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
                <span>🛡️ 안전도: {post.safety}</span>
                <span>❤️ {post.likes}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>
          ))}
      </div>

      {/* 팝업 모달창 창 영역 */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", width: "100%", maxWidth: "540px", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "none", border: "none", fontSize: "1.5rem", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b", margin: "0 0 6px 0" }}>여행 후기 작성</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 24px 0", fontSize: "0.95rem", fontWeight: "500" }}>여행 경험을 다른 사람들과 공유해주세요</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>국가</label>
                <input type="text" placeholder="예: 일본" value={newPost.country} onChange={(e) => setNewPost({...newPost, country: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>제목</label>
                <input type="text" placeholder="후기 제목을 입력하세요" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>내용</label>
                <textarea placeholder="여행 경험을 자세히 작성해주세요" rows="4" value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>전체 평점</label>
                  <select value={newPost.rating} onChange={(e) => setNewPost({...newPost, rating: Number(e.target.value)})} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", fontWeight: "600" }}>
                    <option value={5}>⭐⭐⭐⭐⭐</option>
                    <option value={4}>⭐⭐⭐⭐</option>
                    <option value={3}>⭐⭐⭐</option>
                    <option value={2}>⭐⭐</option>
                    <option value={1}>⭐</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>안전도</label>
                  <select value={newPost.safety} onChange={(e) => setNewPost({...newPost, safety: e.target.value})} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", fontWeight: "600" }}>
                    <option>5 (매우 안전)</option>
                    <option>4 (안전)</option>
                    <option>3 (보통)</option>
                    <option>2 (조금 위험)</option>
                    <option>1 (매우 위험)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button onClick={() => setIsModalOpen(false)} style={{ padding: "14px 28px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "white", fontWeight: "700", cursor: "pointer", color: "#64748b" }}>취소</button>
                <button 
                  onClick={() => {
                    if(!newPost.country || !newPost.title || !newPost.content) {
                      alert("내용을 모두 입력해 주세요!");
                      return;
                    }
                    const postToAdd = {
                      id: Date.now(),
                      author: "익명",
                      country: newPost.country,
                      date: new Date().toISOString().split('T')[0],
                      rating: newPost.rating,
                      title: newPost.title,
                      content: newPost.content,
                      safety: newPost.safety,
                      likes: 0,
                      comments: 0
                    };
                    setPosts([postToAdd, ...posts]);
                    alert("작성이 완료되었습니다!");
                    setNewPost({ country: "", title: "", content: "", rating: 5, safety: "5 (매우 안전)" });
                    setIsModalOpen(false);
                  }} 
                  style={{ padding: "14px 28px", border: "none", backgroundColor: "#000000", color: "white", fontWeight: "700", cursor: "pointer", borderRadius: "12px" }}
                >
                  🚀 작성 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CommunityTab;