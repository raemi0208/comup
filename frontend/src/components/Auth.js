import React, { useState } from "react";
import { supabase } from "./supabaseClient";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // 회원가입 모드 토글용

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");

    if (isSignUp) {
      // 회원가입
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(`회원가입 실패: ${error.message}`);
      else alert("회원가입 성공! 이메일 인증 링크를 확인하거나 로그인를 진행하세요.");
    } else {
      // 로그인
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(`로그인 실패: ${error.message}`);
      else alert("로그인 성공!");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "32px", backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
      <h2 style={{ fontWeight: "900", marginBottom: "24px", color: "#1e293b" }}>
        {isSignUp ? "회원가입" : "로그인"}
      </h2>
      <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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