/**
 * @file authController.js
 * @description 사용자 인증(회원가입 및 로그인) 프로세스를 처리하는 컨트롤러입니다.
 * bcrypt를 이용한 비밀번호 암호화 및 JWT(JSON Web Token) 발급을 통한 토큰 기반 인증을 구현합니다.
 */

// 회원 관리: 회원가입 및 로그인 로직
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { User } = require('../models');
const bcrypt = require('bcrypt');         // 암호화 라이브러리
const jwt = require('jsonwebtoken');      // 토큰 라이브러리
const { SERVER_INSTANCE_ID } = require('../config/serverInstance'); // [추가] 서버 인스턴스 식별값

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
    // [수정] serverInstanceId를 같이 담아서, 서버 재시작 여부를 나중에 검증할 수 있게 합니다.
    const token = jwt.sign(
      { userId: user.id, serverInstanceId: SERVER_INSTANCE_ID },
      process.env.JWT_SECRET, // .env에 미리 적어둔 비밀키
      { expiresIn: '1h' }     // 1시간 동안 유효
    );

    // (2-6) 로그인 성공 응답 변경: 토큰과 함께 프론트엔드가 필요한 유저 정보를 쥐어줍니다!
    res.json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,          // DB에서 자동 생성된 그 id!
        email: user.email,
        nickname: user.nickname
      }
    });

  } catch (error) {
    // (-) 로그인 자체 에러 응답
    res.status(500).json({ error: "로그인 중 오류 발생" });
  }
};

// (3) [추가] 토큰 검증용 엔드포인트
// authMiddleware를 통과했다는 것 자체가 "토큰이 유효하고, 서버가 재시작되지 않았다"는 뜻이므로
// 그냥 success 응답만 보내주면 프론트엔드가 로그인 상태를 유지해도 되는지 판단할 수 있습니다.
exports.verify = async (req, res) => {
  res.json({ success: true, userId: req.userId });
};