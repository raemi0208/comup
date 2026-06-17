import React from "react";
import { ClipboardList } from "lucide-react";
import { supabase } from './supabaseClient';

function ChecklistTab({
  checklist,
  setChecklist,
  newItemName,
  setNewItemName,
  newItemCategory,
  setNewItemCategory,
}) {

  // 1. 체크박스 토글 함수 (DB 업데이트)
  const handleToggleCheck = async (item) => {
    const newCheckedStatus = !item.checked;

    // UI 우선 반영 (Optimistic Update)
    setChecklist(checklist.map(c => c.id === item.id ? { ...c, checked: newCheckedStatus } : c));

    // DB 반영
    const { error } = await supabase
      .from('checklists')
      .update({ checked: newCheckedStatus })
      .eq('id', item.id);

    if (error) {
      console.error("체크박스 업데이트 실패:", error);
      // 실패 시 UI를 원래대로 되돌리는 로직 추가 가능
    }
  };

  // 2. 준비물 추가 함수 (DB 삽입)
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert("준비물 이름을 입력해 주세요!");
      return;
    }

    const newItem = {
      category: newItemCategory,
      name: newItemName,
      desc: "내가 직접 추가한 항목",
      checked: false,
      isCustom: true
    };

    const { data, error } = await supabase
      .from('checklists')
      .insert([newItem])
      .select(); // 추가된 데이터를 바로 받아옴

    if (error) {
      console.error("아이템 추가 실패:", error);
      return;
    }

    if (data) {
      setChecklist([...checklist, data[0]]);
      setNewItemName("");
    }
  };

  return (
    <>
      {/* 상단 타이틀 배너 (기존 디자인 유지) */}
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9", marginBottom: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <ClipboardList size={28} color="#2563eb" />
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#1e293b", margin: 0 }}>여행 체크리스트</h2>
        </div>
        <p style={{ color: "#64748b", margin: 0, fontWeight: "500" }}>안전하고 철저한 여행을 위한 맞춤형 준비물 리스트</p>
      </div>

      {/* 준비 진행률 바 */}
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

      {/* 카테고리별 아이템 렌더링 */}
      {["필수 서류", "보험", "의약품", "현금/카드", "기타"].map((category) => {
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
                  onClick={() => handleToggleCheck(item)}
                  style={{
                    backgroundColor: "white", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px",
                    border: "1px solid #f1f5f9", cursor: "pointer", userSelect: "none",
                    boxShadow: item.checked ? "none" : "0 2px 4px rgba(0,0,0,0.01)"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => { }}
                    style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#2563eb" }}
                  />
                  <div style={{ flex: 1 }}>
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
                  {!item.isCustom && (
                    <span style={{ fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>고위험 지역 필수</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 개인 준비물 추가 구역 */}
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
            style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "14px 28px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}
          >
            리스트에 추가
          </button>
        </div>
      </div>
    </>
  );
}

export default ChecklistTab;