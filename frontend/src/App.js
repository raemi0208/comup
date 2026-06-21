import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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

// [수정] URL 경로(pathname)와 mainTab 값을 서로 매핑합니다.
// 예: "/" -> "home", "/news" -> "news"
const PATH_TO_TAB = {
  "/": "home",
  "/news": "news",
  "/community": "community",
  "/checklist": "checklist",
  "/location": "location",
  "/auth": "auth",
  "/mypage": "mypage",
};
const TAB_TO_PATH = {
  home: "/",
  news: "/news",
  community: "/community",
  checklist: "/checklist",
  location: "/location",
  auth: "/auth",
  mypage: "/mypage",
};

// [추가] 백엔드 주소 (배포 환경 변수 혹은 로컬 테스트용 3000번 포트)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [festivals, setFestivals] = useState([]);
  const [overseasData, setOverseasData] = useState([]);
  const [posts, setPosts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // [수정] mainTab은 더 이상 useState 초기값으로 관리하지 않고, 현재 URL(pathname)에서 바로 계산합니다.
  // 새로고침을 해도 location.pathname이 그대로 유지되므로 mainTab도 항상 올바르게 복원됩니다.
  const mainTab = PATH_TO_TAB[location.pathname] || "home";

  // [수정] subTab(해외여행/국내축제)은 쿼리스트링(?sub=domestic)으로 관리합니다.
  // 이렇게 하면 새로고침해도 subTab까지 그대로 유지됩니다.
  const subTab = searchParams.get("sub") || "overseas";
  const setSubTab = (value) => {
    setSearchParams(value === "overseas" ? {} : { sub: value });
  };

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

  // [수정] 탭 이동 헬퍼: 기존 코드에서 setMainTab("xxx") 형태로 호출하던 부분을
  // navigate(TAB_TO_PATH["xxx"]) 호출로 바꿔주는 함수입니다.
  // 컴포넌트 내부 곳곳에서 동일한 패턴(onClick={() => setMainTab("news")})을 그대로 쓸 수 있게
  // 이름은 setMainTab으로 유지했습니다.
  const setMainTab = (tab) => {
    navigate(TAB_TO_PATH[tab] || "/");
  };

  useEffect(() => {
    // [수정] localStorage에 토큰/유저가 있어도 곧이곧대로 믿지 않고,
    // 백엔드 /api/auth/verify에 직접 물어봐서 "지금도 유효한 토큰인지"를 확인합니다.
    // → 서버가 재시작되면(=SERVER_INSTANCE_ID가 바뀌면) 이 요청이 401로 실패하기 때문에,
    //    서버를 새로 시작할 때마다 모든 사용자가 자동으로 로그아웃 상태로 시작하게 됩니다.
    const checkSupabaseSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setUser(session.user);
      });
    };

    const verifyLogin = async () => {
      const localUser = localStorage.getItem("user");
      const localToken = localStorage.getItem("token");

      // 1. 로컬 스토리지에 로그인 기록 자체가 없으면 -> 바로 로그아웃 상태 유지
      if (!localToken || !localUser) {
        checkSupabaseSession();
        return;
      }

      try {
        // 2. 기록이 있으면 서버한테 "이 토큰 아직 유효해?"라고 직접 물어봅니다.
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${localToken}` }
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // 서버도 유효하다고 확인해준 경우에만 로그인 상태로 복원
          setUser(JSON.parse(localUser));
        } else {
          // 서버 재시작 / 만료 / 무효한 토큰 -> 깨끗하게 정리하고 로그아웃 상태 유지
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          checkSupabaseSession();
        }
      } catch (error) {
        // 서버 자체에 연결이 안 되는 경우 -> 안전하게 로그아웃 상태로 처리
        console.error("로그인 상태 확인 실패:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        checkSupabaseSession();
      }
    };

    verifyLogin();

    // Supabase 로그인 상태 변화 감지용 실시간 리스너 (기존 유지)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
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
          { data: overseasRes, error: overErr }
        ] = await Promise.all([
          supabase.from("posts").select("*"),
          supabase.from("festivals").select("*"),
          supabase.from("overseas_safety").select("*")
        ]);

        if (postsErr || festErr || overErr) {
          throw new Error("데이터를 불러오는 중 오류 발생");
        }

        // [데이터 매핑 로직]
        const transformedFestivals = (festivalsRes || []).map(item => {
          const dateStr = item['축제시작일자'] || "";
          let calculatedSeason = "봄";

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
            season: item['시즌'] || calculatedSeason
          };
        });

        setPosts(postsRes || []);
        setFestivals(transformedFestivals);
        setOverseasData(overseasRes || []);
      } catch (error) {
        console.error("Supabase 로딩 실패:", error.message);
      }
    };

    loadData();
  }, []);

  // 통계 계산 로직
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

        {/* 1. [좌측] 세로 직사각형 고정 광고 영역 */}
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
            <p style={{ margin: "0", color: "#64748b", fontSize: "0.85rem", fontWeight: "600", lineHeight: "1.4" }}>
              최저가 여행자 보험 비교부터 가입까지 한번에 해결하세요!
            </p>
          </div>
        </aside>

        {/* 2. [우측] 메인 컴포넌트 렌더링 영역 */}
        {/* [수정] mainTab === "xxx" && <Component /> 방식 대신 <Routes>/<Route>를 사용합니다.
            이렇게 하면 React Router가 현재 URL(pathname)에 맞는 컴포넌트만 렌더링하고,
            새로고침 시에도 브라우저가 보낸 요청 경로를 기준으로 동일한 화면을 다시 그려줍니다. */}
        <div style={{ flex: 1, minWidth: "0" }}>
          <Routes>
            <Route path="/" element={<HomeTab subTab={subTab} viewMode={viewMode} setViewMode={setViewMode} renderStats={renderStats} overseasData={overseasData} festivals={festivals} />} />
            <Route path="/news" element={<NewsTab newsCategory={newsCategory} setNewsCategory={setNewsCategory} />} />
            <Route path="/community" element={<CommunityTab posts={posts} setPosts={setPosts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} newPost={newPost} setNewPost={setNewPost} />} />
            <Route path="/checklist" element={<ChecklistTab />} />
            <Route path="/location" element={<LocationTab user={user} roomId="우리들의 안전 여행 방" />} />
            <Route path="/auth" element={<Auth setMainTab={setMainTab} setUser={setUser} />} />
            <Route path="/mypage" element={<MyPage user={user} />} />
            {/* 정의되지 않은 경로는 홈으로 */}
            <Route path="*" element={<HomeTab subTab={subTab} viewMode={viewMode} setViewMode={setViewMode} renderStats={renderStats} overseasData={overseasData} festivals={festivals} />} />
          </Routes>
        </div>

      </main>
    </div>
  );
}

export default App;
