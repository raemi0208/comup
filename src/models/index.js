/**
 * @file index.js
 * @description 애플리케이션 내 모든 Sequelize 데이터 모델 인스턴스를 통합 관리하고, 데이터베이스 관계 엔티티 매핑(ORM Associations)을 중앙 제어하는 허브입니다.
 * 커뮤니티, 실시간 위치 공유, 마이페이지, 체크리스트 도메인 간의 외래키 제약조건 및 연쇄 삭제(Cascade) 무결성을 수립합니다.
 */

const sequelize = require('../config/db'); 
const { DataTypes } = require('sequelize');

// 도메인별 데이터 엔티티 모델 로드 및 데이터베이스 인스턴스 주입
const User = require('./User')(sequelize, DataTypes);
const Post = require('./Post')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);

const Room = require('./Room')(sequelize, DataTypes);
const RoomMember = require('./RoomMember')(sequelize, DataTypes);
const Location = require('./UserLocation')(sequelize, DataTypes);

const UserStats = require('./UserStats')(sequelize, DataTypes);
const BadgeDef = require('./BadgeDef')(sequelize, DataTypes);

const PostLike = require('./PostLike')(sequelize, DataTypes);
const PostView = require('./PostView')(sequelize, DataTypes);

const Checklist = require('./Checklist')(sequelize, DataTypes);


// ==========================================
// [커뮤니티 & 체크리스트 도메인 관계 정의]
// ==========================================

// 사용자(User) 대 게시글(Post) 일대다 관계 정의
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

// 게시글(Post) 대 댓글(Comment) 일대다 관계 정의 (게시글 삭제 시 소속 댓글 연쇄 삭제)
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// 사용자(User) 대 댓글(Comment) 일대다 관계 정의
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// 게시글(Post) 및 사용자(User) 대 좋아요(PostLike) 복합 일대다 관계 정의
Post.hasMany(PostLike, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });
User.hasMany(PostLike, { foreignKey: 'userId' });
PostLike.belongsTo(User, { foreignKey: 'userId' });

// 게시글(Post) 대 조회 기록(PostView) 일대다 관계 정의 (조회수 중복 방지용 스케줄러 필터 연동)
Post.hasMany(PostView, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostView.belongsTo(Post, { foreignKey: 'postId' });

// 사용자(User) 대 체크리스트(Checklist) 일대다 관계 정의 (계정 해지 시 체크리스트 연쇄 정리)
User.hasMany(Checklist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Checklist.belongsTo(User, { foreignKey: 'userId' });


// ==========================================
// [실시간 위치 공유 방 도메인 관계 정의]
// ==========================================

// 위치 공유 방(Room) 대 소속 멤버(RoomMember) 일대다 관계 정의 (방 만료/삭제 시 멤버 관계 데이터 파괴)
Room.hasMany(RoomMember, { foreignKey: 'roomId', onDelete: 'CASCADE' });
RoomMember.belongsTo(Room, { foreignKey: 'roomId' });


// ==========================================
// [마이페이지 및 통계 지표 도메인 관계 정의]
// ==========================================

// 사용자(User) 대 개인 활동 통계(UserStats) 일대일 관계 정의
User.hasOne(UserStats, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserStats.belongsTo(User, { foreignKey: 'user_id' });


/**
 * 중앙 제어식 데이터베이스 통합 데이터 컨텍스트 객체 반환
 */
module.exports = {
  sequelize,
  User,
  Post,
  Comment,
  Room,
  RoomMember,
  Location,
  UserStats,
  BadgeDef,
  PostLike,
  PostView,
  Checklist
};