import React, { useState } from "react";

// setUser 프롭스를 추가로 받아옵니다.
function Auth({ setMainTab, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState(""); 
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
    if (isSignUp && !nickname) return alert("닉네임을 입력해주세요.");

    const endpoint = isSignUp ? "register" : "login";
    const url = `http://localhost:3000/api/auth/${endpoint}`;
    
    const payload = isSignUp 
      ? { email, password, nickname } 
      : { email, password };

    try {
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
          alert("회원가입 성공! 로그인을 진행해주세요.");
          setIsSignUp(false); 
          setPassword("");    
        } else {
          alert("로그인 성공!");
          
          // 1. 토큰 저장
          localStorage.setItem("token", data.token); 
          
          // 2. 유저 정보 세팅 (백엔드에서 data.user를 주면 그걸 쓰고, 없으면 입력한 이메일로 임시 객체 생성)
          const loggedInUser = data.user || { email: email, nickname: data.nickname || "" };
          localStorage.setItem("user", JSON.stringify(loggedInUser));
          
          // 3. App.js의 상위 state를 변경하여 로그인 완료를 앱 전체에 알림
          setUser(loggedInUser); 
          setMainTab("home"); 
        }
      } else {
        alert(`${isSignUp ? "회원가입" : "로그인"} 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신할 수 없습니다. 서버가 켜져 있는지 확인해주세요.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "32px", backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
      <h2 style={{ fontWeight: "900", marginBottom: "24px", color: "#1e293b" }}>
        {isSignUp ? "회원가입" : "로그인"}
      </h2>
      <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
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