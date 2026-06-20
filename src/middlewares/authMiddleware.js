/**
 * @file authMiddleware.js
 * @description HTTP 요청 헤더의 JWT(JSON Web Token)를 검증하여 인증된 사용자만 후속 라우트에 접근할 수 있도록 제한하는 인증 미들웨어입니다.
 * 검증 성공 시 디코딩된 유저 고유 ID(userId)를 요청 객체(req)에 바인딩합니다.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); 
const jwt = require('jsonwebtoken');

/**
 * JWT 인증 미들웨어 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객  체
 * @param {Function} next - 다음 미들웨어 함수로 제어권을 넘기는 콜백 함수
 */
module.exports = (req, res, next) => {
  // Authorization 헤더에서 인증 정보 추출
  const authHeader = req.headers['authorization'];

  // 토큰의 존재 여부 및 Bearer 스키마 스펙 준수 여부 검증
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: "토큰이 없거나 형식이 올바르지 않습니다." });
  }

  // 공백을 기준으로 분할하여 'Bearer ' 접두사를 제외한 순수 JWT 스트링 추출
  const token = authHeader.split(' ')[1];

  try {
    // 환경 변수에 정의된 비밀키를 사용하여 토큰의 서명 및 유효성 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 후속 비즈니스 로직(컨트롤러 등)에서 참조할 수 있도록 유저 고유 ID를 req 객체에 저장
    req.userId = decoded.userId; 
    
    // 다음 미들웨어 또는 라우트 핸들러로 제어권 전환
    next(); 

  } catch (error) {
    // 서명 불일치, 만료된 토큰 등 검증 실패 시 401 Unauthorized 응답 반환
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};