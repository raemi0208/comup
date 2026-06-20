/**
 * @file ChecklistTab.js
 * @description 사용자 맞춤형 여행 준비물 객체(Checklist Entity)를 제어하는 도메인 탭 컴포넌트입니다.
 * 세션 인가 상태(JWT)에 따른 라우팅 가드를 수행하며, 상태 토글 시 데이터 무결성을 위한 
 * 낙관적 업데이트(Optimistic Update) 및 예외 처리 롤백 메커니즘을 내장하고 있습니다.
 */

import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList, Trash2 } from "lucide-react";

// 애플리케이션 코어 데이터 동기화 엔드포인트 베이스 URL
const API_BASE = "http://localhost:3000/api";

/**
 * HTTP 클라이언트 요청 헤더 내 Bearer 인증 컨텍스트 주입 유틸리티 함수입니다.
 * @returns {Object} 
 */
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

function ChecklistTab() {
  // ==========================================
  // 1. 컴포넌트 상태 아키텍처 (Component States)
  // ==========================================
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("기타");
  const [adding, setAdding] = useState(false);

  // 로컬 세션 영속성 계층 내 토큰 부재 여부를 통한 검증 플래그 정의
  const isLoggedIn = !!localStorage.getItem("token");

  /**
   * 원격 서버로부터 세션별 맞춤 체크리스트 데이터 컬렉션을 인제스천하는 비동기 서브루틴입니다.
   */
  const fetchChecklist = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checklist`, { headers: authHeader() });
      if (!res.ok) throw new Error("체크리스트 조회 실패");
      setChecklist(await res.json());
    } catch (e) {
      console.error("[FETCH ERROR] 체크리스트 리소스 바인딩 실패:", e);
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // 의존성 배열 인덱스 변화 추적에 따른 훅 라이프사이클 매핑
  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  /**
   * 특정 체크박스의 상태 변환을 제어하는 이벤트 핸들러입니다.
   * 네트워크 인터벌에 따른 UI 딜레이를 상쇄하기 위해 낙관적 업데이트(Optimistic Update) 후 백엔드 서브루틴을 수행합니다.
   * @param {Object} item - 대상 체크리스트 엔티티 객체
   */
  const handleToggleCheck = async (item) => {
    // UI 파이프라인 최우선 반영 (Optimistic Update 프로세스 구동)
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c)));

    try {
      const res = await fetch(`${API_BASE}/checklist/${item.id}/toggle`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("토글 실패");
      const updated = await res.json();
      // 원격 서버 컨텍스트의 최종 확정 데이터 동기화
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
    } catch (e) {
      console.error("[PATCH ERROR] 체크박스 상태 업데이트 트랜잭션 실패:", e);
      // 데이터 일관성 파괴 방지를 위한 인메모리 스냅샷 상태 롤백(Rollback) 수행
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, checked: item.checked } : c)));
      alert("체크 상태 변경에 실패했습니다.");
    }
  };

  /**
   * 사용자 커스텀 준비물 레코드를 추가 유효성 검증 후 데이터베이스에 적재하는 트랜잭션 핸들러입니다.
   */
  const handleAddItem = async () => {
    if (!localStorage.getItem("token")) { alert("로그인이 필요합니다."); return; }
    if (!newItemName.trim()) {
      alert("준비물 이름을 입력해 주세요!");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/checklist`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          category: newItemCategory,
          name: newItemName,
          desc: "내가 직접 추가한 항목",
          isCustom: true, // 관리자 지정 고위험 필수 규격과 격리하기 위한 가변 식별 플래그
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "추가 실패");
      const newItem = await res.json();
      setChecklist((prev) => [...prev, newItem]);
      setNewItemName("");
    } catch (e) {
      alert(`항목 추가 실패: ${e.message}`);
    } finally {
      setAdding(false);
    }
  };

  /**
   * 식별자 매핑 자원을 파괴하는 영속성 삭제 트랜잭션 비동기 핸들러입니다.
   * @param {number|string} itemId - 대상 체크리스트 레코드 식별자
   */
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("이 항목을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE}/checklist/${itemId}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error((await res.json()).error || "삭제 실패");
      setChecklist((prev) => prev.filter((c) => c.id !== itemId));
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  return (
    <>
      {/* 2-1. 헤더 섹션: 상단 타이틀 배너 컨테이너 */}
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9", marginBottom: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <ClipboardList size={28} color="#2563eb" />
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b", margin: 0 }}>여행 체크리스트</h2>
        </div>
        <p style={{ color: "#64748b", margin: 0, fontWeight: "500" }}>안전하고 철저한 여행을 위한 맞춤형 준비물 리스트</p>
      </div>

      {/* 2-2. 인가 가드 레이어: 비로그인 세션 예외 UI 분기 */}
      {!isLoggedIn ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontWeight: "600", backgroundColor: "white", borderRadius: "24px", border: "1px dashed #e2e8f0" }}>
          로그인하면 나만의 체크리스트를 만들고 관리할 수 있어요.
        </div>
      ) : (
        <>
          {/* 2-3. 수집 진척도 인디케이터 (Progress Metrics Panel) */}
          <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontWeight: "800", color: "#1e293b", fontSize: "1.1rem" }}>준비 진행률</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#2563eb" }}>
                {checklist.length > 0 ? Math.round((checklist.filter(item => item.checked).length / checklist.length) * 100) : 0}%
              </span>
            </div>
            <div style={{ width: "100%", height: "12px", backgroundColor: "#e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{
                width: `${checklist.length > 0 ? (checklist.filter(item => item.checked).length / checklist.length) * 100 : 0}%`,
                height: "100%", backgroundColor: "#2563eb", transition: "width 0.3s ease-in-out"
              }} />
            </div>
            <div style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "600" }}>
              {checklist.filter(item => item.checked).length} / {checklist.length} 항목 완료
            </div>
          </div>

          {/* 2-4. 데이터 바인딩 상태 모델 분기 처리 (Loading / Empty / Render) */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontWeight: "700" }}>불러오는 중...</div>
          ) : checklist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontWeight: "600", backgroundColor: "white", borderRadius: "24px", border: "1px dashed #e2e8f0", marginBottom: "24px" }}>
              아직 등록된 준비물이 없어요. 아래에서 추가해 보세요!
            </div>
          ) : (
            /* 정의된 마스터 도메인 카테고리 시퀀스 기반 순회 루프 스캔 */
            ["필수 서류", "보험", "의약품", "현금/카드", "기타"].map((category) => {
              const categoryItems = checklist.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: "30px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>{category}</h3>
                    <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: "700" }}>
                      {categoryItems.filter(i => i.checked).length}/{categoryItems.length}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "white", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px",
                          border: "1px solid #f1f5f9", userSelect: "none",
                          boxShadow: item.checked ? "none" : "0 2px 4px rgba(0,0,0,0.01)"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleCheck(item)}
                          style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#2563eb", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => handleToggleCheck(item)}>
                          <div style={{
                            fontWeight: "700", color: item.checked ? "#94a3b8" : "#1e293b", fontSize: "1.05rem",
                            textDecoration: item.checked ? "line-through" : "none"
                          }}>{item.name}</div>
                          {item.desc && (
                            <div style={{
                              fontSize: "0.85rem", color: item.checked ? "#cbd5e1" : "#64748b", marginTop: "4px",
                              textDecoration: item.checked ? "line-through" : "none"
                            }}>{item.desc}</div>
                          )}
                        </div>
                        {/* 국가별 리스크 지표 연동에 따른 시스템 필수 항목 바인딩 배지 */}
                        {!item.isCustom && (
                          <span style={{ fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: "6px", fontWeight: "700", flexShrink: 0 }}>고위험 지역 필수</span>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", flexShrink: 0 }}
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* 2-5. 인풋 필드 레이어: 커스텀 자원 인제스천 서브 컴포넌트 */}
          <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "28px", border: "1px solid #f1f5f9", marginTop: "40px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1e293b", marginBottom: "16px" }}>➕ 나만의 준비물 추가하기</h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                style={{ padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontWeight: "700", color: "#475569", outline: "none", cursor: "pointer" }}
              >
                <option value="필수 서류">필수 서류</option>
                <option value="보험">보험</option>
                <option value="의약품">의약품</option>
                <option value="현금/카드">현금/카드</option>
                <option value="기타">기타 항목</option>
              </select>

              <input
                type="text"
                placeholder="예: 멀티어댑터, 충전기 등 입력"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                style={{ flex: 1, minWidth: "200px", padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: "600" }}
              />

              <button
                onClick={handleAddItem}
                disabled={adding}
                style={{ backgroundColor: adding ? "#94a3b8" : "#2563eb", color: "white", border: "none", padding: "14px 28px", borderRadius: "12px", fontWeight: "700", cursor: adding ? "not-allowed" : "pointer" }}
              >
                {adding ? "추가 중..." : "리스트에 추가"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ChecklistTab;