/*
□ authMiddleware.js: 로그인 로직 (토큰 검사 후 userID 부여)
*/

// 로그인한 사람만 글을 쓸 수 있도록!
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); 
const jwt = require('jsonwebtoken');

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

    // [5] 요청의 userID 속성에 디코딩된 ID 저장
    req.userId = decoded.userId; // 다음 로직에서 쓸 수 있게 저장
    next(); // 통과! 다음 함수로 이동

  } catch (error) {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};