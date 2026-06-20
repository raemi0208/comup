/**
 * @file authMiddleware.js
 * @description HTTP 요청 헤더의 JWT(JSON Web Token)를 검증하여 인증된 사용자만 후속 라우트에 접근할 수 있도록 제한하는 인증 미들웨어입니다.
 * 검증 성공 시 디코딩된 유저 고유 ID(userId)를 요청 객체(req)에 바인딩합니다.
 */

// 로그인한 사람만 글을 쓸 수 있도록
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');
const { SERVER_INSTANCE_ID } = require('../config/serverInstance'); // [추가] 서버 인스턴스 식별값

module.exports = (req, res, next) => {
  // [1] 헤더에서 토큰을 가져오기
  const authHeader = req.headers['authorization'];

  // [2] 토큰이 없거나 형식이 Bearer로 시작하지 않으면 차단
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: "토큰이 없거나 형식이 올바르지 않습니다." });
  }

  // [3] 'Bearer ' 뒷부분의 실제 토큰값만 가져온다.
  const token = authHeader.split(' ')[1];

  try {
    // [4] 토큰이 유효한지 검사
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // [4-1] [추가] 이 토큰이 "지금 켜져있는 서버"에서 발급된 토큰인지 확인합니다.
    // 서버가 재시작되면 SERVER_INSTANCE_ID가 바뀌므로,
    // 재시작 전에 발급된 토큰은 여기서 막혀서 다시 로그인해야 합니다.
    if (decoded.serverInstanceId !== SERVER_INSTANCE_ID) {
      return res.status(401).json({ error: "서버가 재시작되어 로그인 정보가 만료되었습니다. 다시 로그인해주세요." });
    }

    // [5] 요청의 userID 속성에 디코딩된 ID 저장
    req.userId = decoded.userId; // 다음 로직에서 쓸 수 있게 저장
    next(); // 통과! 다음 함수로 이동

  } catch (error) {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};