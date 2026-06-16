/*
□ index.js: 커뮤니티 관계 정의
*/

const sequelize = require('../config/db'); // DB 연결 설정 불러오기

// 커뮤니티 관련 모델 설계도 불러오기
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);

// [1] 유저(User)와 게시글(Post)의 관계
// 한 명의 유저는 많은 게시글을 가질 수 있다 (1:N)
User.hasMany(Post, { foreignKey: 'userId' });
// 게시글은 특정 유저에게 속한다
Post.belongsTo(User, { foreignKey: 'userId' });

// [2] 게시글(Post)과 댓글(Comment)의 관계
// 한 게시글에는 여러 댓글이 달릴 수 있다 (1:N)
// onDelete: 'CASCADE' -> 게시글이 삭제되면 해당 댓글들도 자동으로 함께 삭제
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
// 댓글은 게시글에 속한다. 
Comment.belongsTo(Post, { foreignKey: 'postId' });

// [3] 유저(User)와 댓글(Comment)의 관계
// 한 유저는 여러 댓글을 달 수 있다
User.hasMany(Comment, { foreignKey: 'userId' });
// 댓글은 유저에 속한다. 
Comment.belongsTo(User, { foreignKey: 'userId' });


module.exports = {
  sequelize,
  User,
  Post,
  Comment
};