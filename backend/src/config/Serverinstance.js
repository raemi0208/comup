/**
 * @file serverInstance.js
 * @description 서버 프로세스가 "켜질 때마다" 새로 생성되는 고유 값입니다.
 *
 * 이 값을 로그인 시 발급하는 JWT 토큰 안에 같이 담아두고,
 * 매 요청마다 authMiddleware에서 "지금 서버의 SERVER_INSTANCE_ID"와 비교합니다.
 *
 * → 서버를 재시작하면 이 값이 바뀌기 때문에,
 *    재시작 전에 발급됐던 토큰은 (만료시간이 안 지났어도) 더 이상 통과하지 못합니다.
 *    = 서버를 새로 시작할 때마다 모든 사용자가 로그아웃 상태로 시작하게 됩니다.
 */
module.exports = {
  SERVER_INSTANCE_ID: Date.now().toString(),
};