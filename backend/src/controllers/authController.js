/**
 * @file authController.js
 * @description 사용자 인증(회원가입 및 로그인) 프로세스를 처리하는 컨트롤러입니다.
 * bcrypt를 이용한 비밀번호 암호화 및 JWT(JSON Web Token) 발급을 통한 토큰 기반 인증을 구현합니다.
 */

// 외부에 위치한 .env 파일 로드를 위한 경로 설정 및 환경변수 주입
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { User } = require('../models');      // Sequelize 유저 모델 인스턴스
const bcrypt = require('bcrypt');         // 비밀번호 해싱 및 비교를 위한 라이브러리
const jwt = require('jsonwebtoken');      // 인증 토큰(JWT) 생성 및 검증을 위한 라이브러리

/**
 * 회원가입 처리
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    // 요청 본문(RequestBody)에서 가입 정보 추출
    const { email, password, nickname } = req.body;

    // 비밀번호 안전하게 단방향 암호화 (Salt Rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 데이터베이스에 새로운 유저 레코드 생성
    await User.create({ email, password: hashedPassword, nickname });

    // 성공 응답 반환
    res.status(201).json({ message: "회원가입 성공!" });

  } catch (error) {
    // 서버 내부 오류 발생 시 예외 처리
    res.status(500).json({ error: "회원가입 중 오류 발생" });
  }
};

/**
 * 로그인 처리 및 JWT 토큰 발급
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    // 요청된 이메일로 가입된 사용자 조회
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    // 1. 사용자 존재 여부 확인
    if (!user) return res.status(404).json({ error: "존재하지 않는 사용자입니다." });

    // 2. 입력된 비밀번호와 DB에 저장된 암호화 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);

    // 3. 비밀번호 일치 여부 확인
    if (!isMatch) return res.status(401).json({ error: "비밀번호가 틀렸습니다." });

    // 4. 인증 성공 시 JWT 발급 (페이로드에 userId 포함, 1시간 유효)
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, // 환경변수에 정의된 JWT 비밀키
      { expiresIn: '1h' }     
    );

    // 5. 토큰 및 프론트엔드에서 활용할 최소한의 유저 정보 반환
    res.json({ 
      message: "로그인 성공", 
      token,
      user: {
        id: user.id,          // 고유 식별자 ID
        email: user.email,
        nickname: user.nickname
      }
    });
    
  } catch (error) {
    // 서버 내부 오류 발생 시 예외 처리
    res.status(500).json({ error: "로그인 중 오류 발생" });
  }
};