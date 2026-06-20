/**
 * @file Badge.js
 * @description 가미피케이션(Gamification) 요소인 사용자 업적/뱃지를 시각화하는 UI 컴포넌트입니다.
 * 전달받은 수집 지표(currentCount)와 목표 임계치(threshold)를 비교 연산하여 
 * 동적으로 컴포넌트의 활성화 상태(Achieved) 스키마를 렌더링합니다.
 */

import React from "react";
import { FaMedal, FaPencilAlt, FaMapMarkerAlt, FaUserFriends } from "react-icons/fa";

/**
 * @description 업적 카테고리 분류별 렌더링에 매핑되는 React-Icons 컴포넌트 딕셔너리
 * - attendance: 출석 세션 달성 지표
 * - post: 커뮤니티 도메인 활성화 레코드 수
 * - landmark: 위치 기반 지오펜싱(Geofencing) 방문 횟수
 * - friend: 실시간 위치 정보 공유 세션 생성 수
 */
const CATEGORY_ICON = {
  attendance: FaMedal,
  post: FaPencilAlt,
  landmark: FaMapMarkerAlt,
  friend: FaUserFriends,
};

/**
 * @description 업적 카테고리별 UI 테마 포인트 컬러 정의셋 (Hex Code 형태)
 */
const CATEGORY_COLOR = {
  attendance: "#f59e0b", // 메달: 골드 계열 (임계치 초과 시 활성 컬러)
  post: "#3b82f6",       // 연필: 블루 계열
  landmark: "#10b981",   // 지도핀: 그린 계열
  friend: "#8b5cf6",     // 친구: 퍼플 계열
};

/**
 * @param {Object} props
 * @param {string} props.name - 뱃지의 명칭 (UI 노출 헤드라인 텍스트)
 * @param {('attendance'|'post'|'landmark'|'friend')} props.category - 업적 분류 식별자
 * @param {number} props.threshold - 업적 달성에 필요한 타겟 목표치
 * @param {number} [props.currentCount=0] - 사용자의 현재 누적 활동 횟수 데이터
 */
export function Badge({ name, category, threshold, currentCount = 0 }) {
  // 런타임 업적 달성 여부 유효성 검증 판별식
  const achieved = currentCount >= threshold;
  
  // 예외 처리: 매핑 정보가 부재할 경우 기본 뱃지 메달 아이콘 및 그레이 아웃 컬러 할당
  const Icon = CATEGORY_ICON[category] || FaMedal;
  const color = CATEGORY_COLOR[category] || "#94a3b8";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        padding: "14px 8px",
        borderRadius: "16px",
        // 달성 여부에 따른 스타일 분기: 알파 채널 삽입을 통한 백그라운드 투명도 가변 적용
        backgroundColor: achieved ? `${color}14` : "#f8fafc",
        border: achieved ? `1px solid ${color}40` : "1px solid #f1f5f9",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: achieved ? color : "#e2e8f0",
          boxShadow: achieved ? `0 4px 12px ${color}66` : "none",
          transition: "all 0.2s ease",
        }}
      >
        <Icon size={24} color={achieved ? "#ffffff" : "#cbd5e1"} />
      </div>

      <span
        style={{
          fontSize: "0.78rem",
          fontWeight: "700",
          color: achieved ? "#1e293b" : "#cbd5e1",
          textAlign: "center",
        }}
      >
        {name}
      </span>

      {/* 가시성 제어: 업적 미달성 상태일 경우에 한해 현재 진행도/목표 도달률 수치 노출 */}
      {!achieved && (
        <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600" }}>
          {currentCount} / {threshold}
        </span>
      )}
    </div>
  );
}

export default Badge;