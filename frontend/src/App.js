import React, { useState, useEffect } from "react";
import HomeTab from "./components/HomeTab";
import NewsTab from "./components/NewsTab";
import ChecklistTab from "./components/ChecklistTab";
import CommunityTab from "./components/CommunityTab";
import LocationTab from "./components/LocationTab";
import { Globe, Home, Newspaper, Users, ClipboardList, Navigation } from "lucide-react";
import "./App.css";
import Auth from "./components/Auth";
import MyPage from "./components/MyPage";
// Supabase 클라이언트 불러오기
import { supabase } from "./components/supabaseClient";

function App() {
  const [festivals, setFestivals] = useState([]);
  const [overseasData, setOverseasData] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [posts, setPosts] = useState([]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("기타");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState("home");
  const [subTab, setSubTab] = useState("overseas");
  const [viewMode, setViewMode] = useState("map");
  const [newsCategory, setNewsCategory] = useState("전체");

  const [user, setUser] = useState(null);

  const [newPost, setNewPost] = useState({
    country: "",
    title: "",
    content: "",
    rating: 5,
    safety: "5 (매우 안전)"
  });

  useEffect(() => {
    // 1. 현재 로컬에 남아있는 세션 정보가 있는지 먼저 확인해서 불러옴
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. 로그인 버튼을 누르거나 로그아웃 버튼을 누를 때의 변화를 실시간으로 캐치하여 유저 정보를 갱신
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // DB에서 데이터 불러오기 (Supabase 연동 및 데이터 매핑)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { data: postsRes, error: postsErr },
          { data: festivalsRes, error: festErr },
          { data: overseasRes, error: overErr },
          { data: checklistRes, error: checkErr }
        ] = await Promise.all([
          supabase.from("posts").select("*"),
          supabase.from("festivals").select("*"),
          supabase.from("overseas_safety").select("*"),
          supabase.from("checklists").select("*")
        ]);

        if (postsErr || festErr || overErr || checkErr) {
          throw new Error("데이터를 불러오는 중 오류 발생");
        }

        // [데이터 매핑 로직]
        const transformedFestivals = (festivalsRes || []).map(item => {
          // 날짜에서 월을 추출하여 시즌 계산 (안전장치 기능)
          const dateStr = item['축제시작일자'] || "";
          let calculatedSeason = "봄"; // 기본값

          if (dateStr) {
            const month = parseInt(dateStr.split(/[-.]/)[1]) || 0;
            if (month >= 3 && month <= 5) calculatedSeason = "봄";
            else if (month >= 6 && month <= 8) calculatedSeason = "여름";
            else if (month >= 9 && month <= 11) calculatedSeason = "가을";
            else if (month === 12 || month === 1 || month === 2) calculatedSeason = "겨울";
          }

          return {
            id: item.id,
            name: item['축제명'] || "이름 없음",
            coordinates: [
              parseFloat(item['경도']) || 0,
              parseFloat(item['위도']) || 0
            ],
            color: "#10b981",
            // DB에 '시즌' 컬럼이 있으면 그걸 쓰고, 없으면 계산된 값을 씁니다.
            season: item['시즌'] || calculatedSeason
          };
        });

        setPosts(postsRes || []);
        setFestivals(transformedFestivals);
        setOverseasData(overseasRes || []);
        setChecklist(checklistRes || []);
      } catch (error) {
        console.error("Supabase 로딩 실패:", error.message);
      }
    };

    loadData();
  }, []);

  // 통계 계산 로직 (안전장치 추가 완료)
  const renderStats = () => {
    if (subTab === "overseas") {
      const counts = [1, 2, 3, 4].map(lv => overseasData.filter(d => d.level?.startsWith(lv.toString())).length);
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
          {/* f.season이 존재하지 않을 때를 대비해 덧붙인 안전 코딩 (f.season || "") */}
          <div style={{ fontSize: "1.5rem", fontWeight: "900" }}>
            {festivals.filter(f => (f.season || "") === s).length}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{s} 축제</div>
        </div>
      ));
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "60px" }}>
      {/* GNB 영역 */}
      <header style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: "80px", padding: "0 20px" }}>
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

            {/* 로그인 상태에 따른 조건부 우측 버튼 */}
            {user ? (
              <button
                onClick={() => setMainTab("mypage")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700",
                  backgroundColor: mainTab === "mypage" ? "#eff6ff" : "transparent", color: mainTab === "mypage" ? "#2563eb" : "#64748b",
                }}
              >
                마이페이지
              </button>
            ) : (
              <button
                onClick={() => setMainTab("auth")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700",
                  backgroundColor: mainTab === "auth" ? "#eff6ff" : "transparent", color: mainTab === "auth" ? "#2563eb" : "#64748b",
                }}
              >
                로그인
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 서브 탭 (홈 탭일 때만 표시) */}
      {mainTab === "home" && (
        <div style={{ maxWidth: "1400px", margin: "24px auto 0", padding: "0 20px" }}>
          <div style={{ backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "50px", display: "flex", border: "1px solid #e2e8f0" }}>
            <button onClick={() => setSubTab("overseas")} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: "700", backgroundColor: subTab === "overseas" ? "white" : "transparent", color: subTab === "overseas" ? "#1e293b" : "#64748b", boxShadow: subTab === "overseas" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>해외 여행</button>
            <button onClick={() => setSubTab("domestic")} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: "700", backgroundColor: subTab === "domestic" ? "white" : "transparent", color: subTab === "domestic" ? "#1e293b" : "#64748b", boxShadow: subTab === "domestic" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>국내 축제</button>
          </div>
        </div>
      )}

      <main style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "24px",
        display: "flex",
        gap: "30px",
        alignItems: "flex-start"
      }}>

        {/* 1. [좌측] 세로 직사각형 고정 광고 영역 (바구니 시작) */}
        <aside style={{
          width: "260px",  
          minWidth: "180px",
          position: "sticky",
          top: "104px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            {/* 세로로 긴 직사각형 배너 공간 */}
            <div style={{
              height: "450px",
              backgroundColor: "#f1f5f9",
              borderRadius: "16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#94a3b8",
              fontWeight: "700",
              fontSize: "0.9rem",
              border: "2px dashed #cbd5e1",
              marginBottom: "16px"
            }}>
              ADVERTISEMENT
            </div>
            <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontWeight: "800", fontSize: "1rem" }}>
              안전한 여행의 시작 ✈️
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", fontWeight: "600", lineHeight: "1.4" }}>
              최저가 여행자 보험 비교부터 가입까지 한번에 해결하세요!
            </p>
          </div>
        </aside>

        {/* 2. [우측] 기존 메인 컴포넌트 렌더링 영역 */}
        <div style={{ flex: 1, minWidth: "0" }}>
          {mainTab === "news" && <NewsTab newsCategory={newsCategory} setNewsCategory={setNewsCategory} />}
          {mainTab === "community" && <CommunityTab posts={posts} setPosts={setPosts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} newPost={newPost} setNewPost={setNewPost} />}
          {mainTab === "checklist" && <ChecklistTab checklist={checklist} setChecklist={setChecklist} newItemName={newItemName} setNewItemName={setNewItemName} newItemCategory={newItemCategory} setNewItemCategory={setNewItemCategory} />}
          {mainTab === "home" && <HomeTab subTab={subTab} viewMode={viewMode} setViewMode={setViewMode} renderStats={renderStats} overseasData={overseasData} festivals={festivals} />}
          {mainTab === "location" && <LocationTab user={user} roomId="우리들의 안전 여행 방" />}

          {mainTab === "auth" && <Auth />}
          {mainTab === "mypage" && <MyPage user={user} />}
        </div>

      </main>
    </div>
  );
}

export default App;