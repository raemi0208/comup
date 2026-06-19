/*
□ index.js: 모든 DB 모델 관리 및 관계 정의
*/

const sequelize = require('../config/db'); // DB 연결 설정 불러오기
const { DataTypes } = require('sequelize');

// 1. 모든 모델 설계도 불러오기 및 초기화
const User = require('./User')(sequelize, DataTypes);
const Post = require('./Post')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);

const Room = require('./Room')(sequelize, DataTypes);
const RoomMember = require('./RoomMember')(sequelize, DataTypes);
const Location = require('./UserLocation')(sequelize, DataTypes);


// 2. [커뮤니티] 관계 정의
// [2-1] 유저(User)와 게시글(Post)의 관계 (1:N)
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

// [2-2] 게시글(Post)과 댓글(Comment)의 관계 (1:N)
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// [2-3] 유저(User)와 댓글(Comment)의 관계 (1:N)
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });


// 3. [위치 공유 방] 관계 정의 (필요 시 추가)
// Rooms 테이블과 RoomMembers 테이블 간의 관계 (1:N)
Room.hasMany(RoomMember, { foreignKey: 'roomId', onDelete: 'CASCADE' });
RoomMember.belongsTo(Room, { foreignKey: 'roomId' });


// 4. 모든 객체와 모델을 단 하나의 객체로 묶어서 한 번에 내보내기
module.exports = {
  sequelize,
  User,
  Post,
  Comment,
  Room,
  RoomMember,
  Location
};