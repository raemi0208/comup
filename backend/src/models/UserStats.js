/**
 * @file UserStats.js
 * @description 사용자의 확장 프로필(바이오, 아바타) 및 마이페이지 내 뱃지 시스템 해금을 위한 다양한 활동 지표 카운터(출석, 게시글, 방문 랜드마크, 친구 수)를 관리하는 Sequelize 모델입니다.
 * User 모델과 1:1 종속 관계를 형성하며, 게이미피케이션(Gamification) 업적 달성 검증 조건의 기준 데이터 스냅샷으로 활용됩니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * UserStats:
 * type: object
 * required:
 * - user_id
 * properties:
 * user_id:
 * type: integer
 * description: 마스터 User 모델의 고유 식별자를 참조하는 식별 관계형 기본키 (외래키 공유)
 * example: 7
 * bio:
 * type: string
 * description: 사용자가 직접 작성한 한 줄 소개 또는 자기소개 본문 텍스트
 * nullable: true
 * example: "안전한 세계 여행을 지향하는 3년 차 배낭여행러입니다."
 * avatar_url:
 * type: string
 * description: 클라우드 스토리지(S3 등)에 적재된 사용자 프로필 아바타 이미지의 자원 위치 URL
 * nullable: true
 * example: "https://storage.googleapis.com/app-profiles/avatar_7.png"
 * attendance_count:
 * type: integer
 * description: 사용자의 앱 누적 출석 일수 (연속 출석 뱃지 트리거 연동)
 * default: 0
 * example: 45
 * post_count:
 * type: integer
 * description: 커뮤니티 영역에 작성한 총 게시글(원글) 개수 (글쓰기 마스터 업적 연동)
 * default: 0
 * example: 12
 * landmark_count:
 * type: integer
 * description: 위치 인증 시스템을 통해 방문이 확인된 고유 랜드마크 및 체크포인트 누적 수
 * default: 0
 * example: 5
 * friend_count:
 * type: integer
 * description: 플랫폼 내부에서 동기화 및 상호 맺어진 소셜 친구의 총 수
 * default: 0
 * example: 28
 * created_at:
 * type: string
 * format: date-time
 * description: 해당 확장 프로필 및 통계 테이블 최초 생성 일시
 * example: "2026-03-15T10:00:00.000Z"
 * updated_at:
 * type: string
 * format: date-time
 * description: 카운터 트래킹 갱신 또는 프로필 정보가 수정된 최종 일시
 * example: "2026-06-20T17:23:35.000Z"
 */
module.exports = (sequelize) => {
    return sequelize.define('UserStats', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'user_id'
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'avatar_url'
        },
        attendance_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'attendance_count'
        },
        post_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'post_count'
        },
        landmark_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'landmark_count'
        },
        friend_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'friend_count'
        }
    }, {
        tableName: 'user_stats',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
};