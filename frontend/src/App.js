import React, { useState } from "react";
import HomeTab from "./components/HomeTab";
import NewsTab from "./components/NewsTab";
import ChecklistTab from "./components/ChecklistTab";
import CommunityTab from "./components/CommunityTab";
import { Globe, Home, Newspaper, Users, ClipboardList, Navigation } from "lucide-react";
import "./App.css";

const festivals = [
  { name: "인천 봄꽃 축제", coordinates: [126.7052, 37.4563], color: "#ec4899", season: "봄" },
  { name: "강원 산나물 축제", coordinates: [128.8737, 37.7519], color: "#ec4899", season: "봄" },
  { name: "대구 치맥 페스티벌", coordinates: [128.6014, 35.8714], color: "#3b82f6", season: "여름" },
  { name: "부산 바다 축제", coordinates: [129.0756, 35.1796], color: "#3b82f6", season: "여름" },
  { name: "진주 유등 축제", coordinates: [128.0846, 35.1802], color: "#f97316", season: "가을" },
  { name: "서울 문화제", coordinates: [126.9780, 37.5665], color: "#a855f7", season: "겨울" },
];

const overseasData = [
  { country: "일본", level: "1단계 (여행유의)", color: "#2563eb" },
  { country: "베트남", level: "1단계 (여행유의)", color: "#2563eb" },
  { country: "프랑스", level: "2단계 (여행자제)", color: "#ca8a04" },
  { country: "터키", level: "2단계 (여행자제)", color: "#ca8a04" },
  { country: "이스라엘", level: "3단계 (출국권고)", color: "#ea580c" },
  { country: "우크라이나", level: "4단계 (여행금지)", color: "#dc2626" },
];

function App() {
  const [checklist, setChecklist] = useState([
    { id: 1, category: "필수 서류", name: "여권", desc: "유효기간 6개월 이상 남은 여권", checked: false },
    { id: 2, category: "필수 서류", name: "비자", desc: "목적지 국가 방문에 필요한 비자 확인", checked: false },
    { id: 3, category: "보험", name: "여행자 보험", desc: "해외 여행자 보험 가입", checked: false },
    { id: 4, category: "의약품", name: "상비약", desc: "소화제, 진통제, 감기약", checked: false },
    { id: 5, category: "의약품", name: "처방약", desc: "개인 처방약 및 처방전", checked: false },
    { id: 6, category: "현금/카드", name: "신용카드", desc: "해외 결제 가능 여부 확인", checked: false },
    { id: 7, category: "현금/카드", name: "현지 통화", desc: "필요한 만큼의 현지 화폐 환전", checked: false },
  ]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("기타");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "김여행",
      country: "일본",
      date: "2026-03-28",
      rating: 5,
      title: "도쿄 3박 4일 후기 - 매우 안전했어요!",
      content: "지난주에 도쿄를 다녀왔습니다. 밤늦게까지 돌아다녔는데도 치안이 정말 좋았습니다. 분실물도 다 돌아왔어요!",
      tags: ["#안전", "#추천", "#도쿄"],
      safety: "5 (매우 안전)",
      likes: 45,
      comments: 12
    }
  ]);

  const [newPost, setNewPost] = useState({
    country: "",
    title: "",
    content: "",
    rating: 5,
    safety: "5 (매우 안전)"
  });

  const [mainTab, setMainTab] = useState("home");
  const [subTab, setSubTab] = useState("overseas");
  const [viewMode, setViewMode] = useState("map");
  const [newsCategory, setNewsCategory] = useState("전체");

  const renderStats = () => {
    if (subTab === "overseas") {
      const counts = [1, 2, 3, 4].map(lv => overseasData.filter(d => d.level.startsWith(lv)).length);
      return ["여행유의", "여행자제", "출국권고", "여행금지"].map((label, i) => (
        <div key={label} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", padding: "20px", borderRadius: "16px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{counts[i]}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{label}</div>
        </div>
      ));
    } else {
      const seasons = ["봄", "여름", "가을", "겨울"];
      return seasons.map(s => (
        <div key={s} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", padding: "20px", borderRadius: "16px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>{festivals.filter(f => f.season === s).length}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{s} 축제</div>
        </div>
      ));
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "60px" }}>

      {/* 1. GNB 영역 */}
      <header style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: "80px", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Globe size={28} color="#2563eb" fill="#2563eb" />
            <h1 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#1e3a8a", margin: 0 }}>여행사무소</h1>
          </div>
          <nav style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "home", label: "홈", icon: <Home size={18} /> },
              { id: "news", label: "뉴스", icon: <Newspaper size={18} /> },
              { id: "community", label: "커뮤니티", icon: <Users size={18} /> },
              { id: "checklist", label: "체크리스트", icon: <ClipboardList size={18} /> },
              { id: "location", label: "내 위치", icon: <Navigation size={18} /> },
            ].map((item) => (
              <button key={item.id} onClick={() => setMainTab(item.id)} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700",
                backgroundColor: mainTab === item.id ? "#eff6ff" : "transparent", color: mainTab === item.id ? "#2563eb" : "#64748b",
              }}>{item.icon} {item.label}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* 2. 서브 탭 (홈 탭일 때만 노출) */}
      {mainTab === "home" && (
        <div style={{ maxWidth: "1200px", margin: "24px auto 0", padding: "0 20px" }}>
          <div style={{ backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "50px", display: "flex", border: "1px solid #e2e8f0" }}>
            <button onClick={() => setSubTab("overseas")} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: "700", backgroundColor: subTab === "overseas" ? "white" : "transparent", color: subTab === "overseas" ? "#1e293b" : "#64748b", boxShadow: subTab === "overseas" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>해외 여행</button>
            <button onClick={() => setSubTab("domestic")} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: "700", backgroundColor: subTab === "domestic" ? "white" : "transparent", color: subTab === "domestic" ? "#1e293b" : "#64748b", boxShadow: subTab === "domestic" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>국내 축제</button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>

        {/* 1️⃣ [뉴스 탭 영역] */}
        {mainTab === "news" && (
          <NewsTab newsCategory={newsCategory} setNewsCategory={setNewsCategory} />
        )}

        {/* 2️⃣ [커뮤니티 탭 영역] */}
        {mainTab === "community" && (
          <CommunityTab
            posts={posts}
            setPosts={setPosts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            newPost={newPost}
            setNewPost={setNewPost}
          />
        )}

        {/* 3️⃣ [체크리스트 탭 영역] */}
        {mainTab === "checklist" && (
          <ChecklistTab
            checklist={checklist}
            setChecklist={setChecklist}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemCategory={newItemCategory}
            setNewItemCategory={setNewItemCategory}
          />
        )}

        {/* 4️⃣ [홈 탭 영역] */}
        {mainTab === "home" && (
          <HomeTab
            subTab={subTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            renderStats={renderStats}
            overseasData={overseasData}
            festivals={festivals}
          />
        )}

      </main>
    </div>
  );
}

export default App;