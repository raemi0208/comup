/*
□ authController.js: 회원가입 및 로그인 처리
*/

// 회원 관리: 회원가입 및 로그인 로직
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { User } = require('../models');
const bcrypt = require('bcrypt');         // 암호화 라이브러리
const jwt = require('jsonwebtoken');      // 토큰 라이브러리

// (1) [회원가입] 요청 -> (1-1) 요청 본문 파싱 -> (1-2) 비밀번호 암호화 -> (1-3) 유저 정보 등록 -> (1-4) 응답 (회원가입 성공 여부)
exports.register = async (req, res) => {
  try {
    // (1-1) 요청 본문의 email, password, nickname 얻고
    const { email, password, nickname } = req.body;

    // (1-2) 비밀번호를 암호화 (숫자 10은 암호화 강도)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // (1-3) User 정보 만들기 
    await User.create({ email, password: hashedPassword, nickname });

    // (1-4) 응답 (회원가입 성공 알림) 하기
    res.status(201).json({ message: "회원가입 성공!" });

  } catch (error) {
    // (-) 에러 날 경우 에러 응답 하기
    res.status(500).json({ error: "회원가입 중 오류 발생" });
  }
};

// (2) [로그인] 요청 -> (2-1) 요청 파싱, user 찾기 -> (2-2 ~ 2-4) 정보 일치 확인 -> (2-5) JWT 토큰 발행 -> (2-6) 로그인 성공 응답
exports.login = async (req, res) => {
  try {
    // (2-1) 요청 본문 파싱, {email}을 조건으로 User 찾기 
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    // (2-2) user가 없을 경우 -> 에러 응답
    if (!user) return res.status(404).json({ error: "존재하지 않는 사용자입니다." });

    // (2-3) user가 있을 경우 -> 입력한 비번을 암호화한 후, DB의 암호화된 비번과 비교
    const isMatch = await bcrypt.compare(password, user.password);

    // (2-4) 비밀번호가 틀렸을 경우 -> 에러 응답
    if (!isMatch) return res.status(401).json({ error: "비밀번호가 틀렸습니다." });

    // (2-5) 로그인이 확인되면 JWT 토큰을 발행
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, // .env에 미리 적어둔 비밀키
      { expiresIn: '1h' }     // 1시간 동안 유효
    );

    // (2-6) 로그인 성공 응답
    res.json({ message: "로그인 성공", token });
    
  } catch (error) {

    // (-) 로그인 자체 에러 응답
    res.status(500).json({ error: "로그인 중 오류 발생" });
  }
};