/**
 * @file CommunityTab.js
 * @description 여행 안전 정보 공유를 위한 커뮤니티 도메인 컴포넌트입니다.
 * 게시글 CRUD 트랜잭션, 댓글 서브루틴, 좋아요/조회수 통계 인프라를 포함하며,
 * 인증 상태(JWT)에 기반한 사용자 권한 제어 및 UI 데이터 동기화 로직을 수행합니다.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Users, Heart, MessageCircle, Eye, Trash2, Send, ChevronDown, ChevronUp, Pencil } from "lucide-react";

const API_BASE = "http://localhost:3000/api";

/**
 * @description HTTP 요청 헤더에 인가용 Bearer 토큰을 주입하는 유틸리티입니다.
 */
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

/**
 * @description ISO 날짜 문자열을 한국 표준시(KST) 기반의 로컬 포맷으로 변환합니다.
 */
const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    : "";

/**
 * @description 게시글 레코드의 수정 여부를 판별합니다.
 * 작성 시점(createdAt)과 최종 갱신 시점(updatedAt)의 델타가 1초를 초과할 경우 수정됨으로 처리합니다.
 */
const isEdited = (post) => {
  if (!post.createdAt || !post.updatedAt) return false;
  return new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000;
};

/**
 * @description 게시글 하위 컨텍스트에서 댓글 데이터를 관리하는 서브 컴포넌트입니다.
 */
function CommentPanel({ postId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[FETCH ERROR] 댓글 인제스천 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (!localStorage.getItem("token")) { alert("로그인이 필요합니다."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ content: input }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "작성 실패");
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setInput("");
    } catch (e) {
      alert(`댓글 작성 실패: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error((await res.json()).error || "삭제 실패");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  return (
    <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 12px" }}>불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 12px" }}>첫 댓글을 남겨보세요!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "#f8fafc", borderRadius: "12px", padding: "12px 14px" }}>
              <div>
                <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.85rem", marginRight: "8px" }}>
                  {c.User?.nickname || "익명"}
                </span>
                <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{formatDate(c.createdAt)}</span>
                <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.9rem", lineHeight: "1.5" }}>{c.content}</p>
              </div>
              {currentUserId && c.userId === currentUserId && (
                <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="댓글을 입력하세요..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", fontWeight: "600", outline: "none" }}
        />
        <button onClick={handleSubmit} disabled={submitting || !input.trim()} style={{ padding: "10px 14px", backgroundColor: submitting ? "#94a3b8" : "#2563eb", color: "white", border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * @description 단일 게시글 뷰 카드 컴포넌트입니다.
 */
function PostCard({ post, currentUserId, onDelete, onEdit }) {
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [views, setViews] = useState(post.views ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount] = useState(post.Comments?.length ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const viewRequestSentRef = React.useRef(false);
  const likeRequestInFlightRef = React.useRef(false);

  const nickname = post.User?.nickname || "익명";
  const country = post.category !== "general" ? post.category : null;

  const handleToggleComments = async () => {
    if (!showComments && !viewRequestSentRef.current) {
      viewRequestSentRef.current = true;
      try {
        const res = await fetch(`${API_BASE}/posts/${post.id}/views`, { method: "PATCH", headers: authHeader() });
        if (res.ok) {
          const data = await res.json();
          setViews(data.views);
        }
      } catch (e) { viewRequestSentRef.current = false; }
    }
    setShowComments((prev) => !prev);
  };

  const handleLike = async () => {
    if (!localStorage.getItem("token")) { alert("로그인이 필요합니다."); return; }
    if (likeRequestInFlightRef.current) return;
    likeRequestInFlightRef.current = true;
    setLikeLoading(true);

    try {
      const res = await fetch(`${API_BASE}/posts/${post.id}/like`, { method: "PATCH", headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    } catch (e) { alert("좋아요 처리 중 오류가 발생했습니다."); } finally {
      likeRequestInFlightRef.current = false;
      setLikeLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "#64748b", fontSize: "1rem", flexShrink: 0 }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "800", color: "#1e293b" }}>{nickname}</span>
              {country && <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>{country}</span>}
            </div>
            <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
              {formatDate(post.createdAt)}
              {isEdited(post) && <span style={{ marginLeft: "6px", color: "#cbd5e1" }}>(수정됨)</span>}
            </span>
          </div>
        </div>
        {currentUserId && post.userId === currentUserId && (
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => onEdit(post)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" }}><Pencil size={16} /></button>
            <button onClick={() => onDelete(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" }}><Trash2 size={17} /></button>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>{post.title}</h3>
      <p style={{ color: "#475569", lineHeight: "1.65", margin: "0 0 18px 0", fontWeight: "500", whiteSpace: "pre-wrap" }}>{post.content}</p>

      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button onClick={handleLike} disabled={likeLoading} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "10px", border: "1.5px solid", borderColor: liked ? "#ef4444" : "#e2e8f0", backgroundColor: liked ? "#fff1f2" : "white", color: liked ? "#ef4444" : "#64748b", fontWeight: "700", fontSize: "0.9rem", cursor: likeLoading ? "not-allowed" : "pointer" }}>
          <Heart size={15} fill={liked ? "#ef4444" : "none"} /> {likes}
        </button>
        <button onClick={handleToggleComments} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "10px", border: "1.5px solid", borderColor: showComments ? "#2563eb" : "#e2e8f0", backgroundColor: showComments ? "#eff6ff" : "white", color: showComments ? "#2563eb" : "#64748b", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}>
          <MessageCircle size={15} /> {commentCount}
          {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", color: "#94a3b8", fontSize: "0.88rem", fontWeight: "600" }}>
          <Eye size={14} /> {views}
        </span>
      </div>
      {showComments && <CommentPanel postId={post.id} currentUserId={currentUserId} />}
    </div>
  );
}

/**
 * @description 커뮤니티 데이터 조회, 필터링, 정렬 및 CRUD 모달을 제어하는 메인 컨트롤러 컴포넌트입니다.
 */
function CommunityTab({ searchQuery, setSearchQuery, isModalOpen, setIsModalOpen, newPost, setNewPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState("latest");
  const [editingPostId, setEditingPostId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id ?? null;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts`, { headers: authHeader() });
      if (!res.ok) throw new Error("목록 조회 실패");
      setPosts(await res.json());
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPostId(null);
    setNewPost({ country: "", title: "", content: "", rating: 5, safety: "5 (매우 안전)" });
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setNewPost({
      country: post.category && post.category !== "general" ? post.category : "",
      title: post.title,
      content: post.content,
      rating: 5,
      safety: "5 (매우 안전)",
    });
    setIsModalOpen(true);
  };

  const handleSubmitPost = async () => {
    if (!newPost.title || !newPost.content) { alert("제목과 내용을 입력해 주세요!"); return; }
    if (!localStorage.getItem("token")) { alert("로그인이 필요합니다."); return; }
    setSubmitting(true);
    try {
      const isEditMode = editingPostId !== null;
      const url = isEditMode ? `${API_BASE}/posts/${editingPostId}` : `${API_BASE}/posts`;
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({ title: newPost.title, content: newPost.content, category: newPost.country || "general" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || (isEditMode ? "수정 실패" : "작성 실패"));

      alert(isEditMode ? "수정이 완료되었습니다!" : "작성이 완료되었습니다!");
      closeModal();
      fetchPosts();
    } catch (e) { alert(`오류: ${e.message}`); } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw new Error((await res.json()).error || "삭제 실패");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) { alert(`삭제 실패: ${e.message}`); }
  };

  const filteredPosts = posts
    .filter((p) => {
      const kw = searchQuery.toLowerCase();
      return (p.title || "").toLowerCase().includes(kw) || (p.content || "").toLowerCase().includes(kw) || (p.category || "").toLowerCase().includes(kw) || (p.User?.nickname || "").toLowerCase().includes(kw);
    })
    .sort((a, b) => {
      if (sortOrder === "likes") return (b.likes ?? 0) - (a.likes ?? 0);
      if (sortOrder === "views") return (b.views ?? 0) - (a.views ?? 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalLikes = posts.reduce((s, p) => s + (p.likes ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.Comments?.length ?? 0), 0);
  const isEditMode = editingPostId !== null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Users size={28} color="#2563eb" />
            <h2 style={{ fontSize: "1.75rem", fontWeight: "900", margin: 0, color: "#1e293b" }}>안전 커뮤니티</h2>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontWeight: "600" }}>실제 여행자들의 생생한 안전 정보를 공유해요</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: "#0f172a", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          + 후기 작성
        </button>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "30px" }}>
        <input type="text" placeholder="🔍 후기 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontWeight: "600", fontSize: "0.95rem", outline: "none" }} />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontWeight: "600", color: "#64748b", outline: "none", cursor: "pointer" }}>
          <option value="latest">🧭 최신순</option>
          <option value="likes">❤️ 추천순</option>
          <option value="views">👁️ 조회순</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {[
          { label: "전체 후기", value: posts.length, color: "#2563eb" },
          { label: "총 좋아요", value: totalLikes, color: "#ef4444" },
          { label: "총 댓글", value: totalComments, color: "#9333ea" },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: "white", border: "1px solid #f1f5f9", borderRadius: "20px", padding: "24px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
            <div style={{ fontSize: "2rem", fontWeight: "900", color: s.color, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: "700" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontWeight: "700" }}>불러오는 중...</div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontWeight: "600", backgroundColor: "#f8fafc", borderRadius: "20px", border: "1px dashed #e2e8f0" }}>
          {searchQuery ? `"${searchQuery}"에 해당하는 후기가 없습니다.` : "아직 작성된 후기가 없습니다. 첫 번째 후기를 남겨보세요!"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={handleDeletePost} onEdit={handleEditPost} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", width: "100%", maxWidth: "540px", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", position: "relative" }}>
            <button onClick={closeModal} style={{ position: "absolute", top: "20px", right: "24px", background: "none", border: "none", fontSize: "1.4rem", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b", margin: "0 0 20px 0" }}>
              {isEditMode ? "여행 후기 수정" : "여행 후기 작성"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input type="text" placeholder="방문 국가 (예: 일본, 프랑스)" value={newPost.country} onChange={(e) => setNewPost({ ...newPost, country: e.target.value })} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600", boxSizing: "border-box", outline: "none" }} />
              <input type="text" placeholder="제목 *" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600", boxSizing: "border-box", outline: "none" }} />
              <textarea placeholder="내용 *" rows="5" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              <button onClick={handleSubmitPost} disabled={submitting} style={{ padding: "14px", border: "none", backgroundColor: submitting ? "#64748b" : "#000", color: "white", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", borderRadius: "12px", fontSize: "1rem" }}>
                {submitting ? "저장 중..." : (isEditMode ? "✏️ 수정 완료" : "🚀 작성 완료")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CommunityTab;