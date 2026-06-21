/**
 * @file Auth.js
 * @description 사용자 인증 인프라를 담당하는 프론트엔드 컴포넌트입니다.
 * 단일 폼 컨텍스트(Single Form Context) 내에서 상태 플래그(isSignUp)에 따라 회원가입 및 로그인 모드를 전환하며,
 * 세션 토큰 및 사용자 프로필 메타데이터를 클라이언트 영속성 계층(LocalStorage)에 동기화합니다.
 */

import React, { useState } from "react";

/**
 * @param {Object} props
 * @param {Function} props.setMainTab - 인증 성공 후 애플리케이션 라우팅 및 뷰 전환을 트리거하는 제어 함수
 * @param {Function} props.setUser - 전역 컨텍스트에 사용자 세션 엔티티를 주입하기 위한 상태 갱신 함수
 */
function Auth({ setMainTab, setUser }) {
  // ==========================================
  // 1. 컴포넌트 로컬 상태 정의 (Local Component States)
  // ==========================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  /**
   * 인증 폼 제출(Submit) 이벤트를 가로채어 백엔드 API 서버와 통신을 수행하는 비동기 핸들러입니다.
   * @param {Event} e - Form Submit Event
   */
  const handleAuth = async (e) => {
    e.preventDefault();
    
    // 무결성 검증: 필수 입력 파라미터 유효성 검사 (클라이언트 사이드 가드)
    if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
    if (isSignUp && !nickname) return alert("닉네임을 입력해주세요.");

    // 상태 플래그에 따른 엔드포인트 및 요청 세그먼트 가변 라우팅
    const endpoint = isSignUp ? "register" : "login";
    const url = `${process.env.REACT_APP_API_URL}/api/auth/${endpoint}`

    const payload = isSignUp
      ? { email, password, nickname }
      : { email, password };

    try {
      // 외부 인증 API 서버에 데이터 인제스천 수행
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignUp) {
          // 회원가입 세션 완료 후 로그인 인터페이스로 뷰 상태 전환 및 컨텍스트 초기화
          alert("회원가입 성공! 로그인을 진행해주세요.");
          setIsSignUp(false);
          setPassword("");
        } else {
          alert("로그인 성공!");

          // A. 인가용 Bearer 토큰의 로컬 스토리지 영속화
          localStorage.setItem("token", data.token);

          // B. 응답 객체 데이터 보장을 위한 구조화 및 세션 프로필 임시 객체 매핑
          const loggedInUser = data.user || { email: email, nickname: data.nickname || "" };
          localStorage.setItem("user", JSON.stringify(loggedInUser));

          // C. 상위 어플리케이션 아키텍처(App.js)의 상태 트리 변환 헬퍼 함수 호출을 통한 홈 라우팅 네비게이션
          setUser(loggedInUser);
          setMainTab("home");
        }
      } else {
        alert(`${isSignUp ? "회원가입" : "로그인"} 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("[AXIOS/FETCH ERROR] 인증 서비스 서브루틴 통신 실패:", error);
      alert("서버와 통신할 수 없습니다. 서버가 켜져 있는지 확인해주세요.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "32px", backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
      <h2 style={{ fontWeight: "900", marginBottom: "24px", color: "#1e293b" }}>
        {isSignUp ? "회원가입" : "로그인"}
      </h2>
      
      <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 회원가입 모드일 경우 활성화되는 추가 식별 필드 */}
        {isSignUp && (
          <input
            type="text" placeholder="닉네임" value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600" }}
          />
        )}

        <input
          type="email" placeholder="이메일 주소" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600" }}
        />
        
        <input
          type="password" placeholder="비밀번호" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "14px", borderRadius: "12px", border: "1px solid #cbd5e1", fontWeight: "600" }}
        />
        
        <button type="submit" style={{ padding: "14px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
          {isSignUp ? "계정 만들기" : "로그인하기"}
        </button>
      </form>
      
      {/* 컴포넌트 인증 모드(Sign-In / Sign-Up) 상호 반전을 위한 상태 제어 트리거 */}
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: "16px", background: "none", border: "none", color: "#64748b", fontWeight: "700", cursor: "pointer", width: "100%" }}
      >
        {isSignUp ? "이미 계정이 있으신가요? 로그인" : "처음이신가요? 회원가입 하러가기"}
      </button>
    </div>
  );
}

export default Auth;
