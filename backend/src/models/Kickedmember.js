const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 강퇴된 유저 기록: 같은 초대 코드로 재입장하는 것을 막기 위한 테이블
const KickedMember = sequelize.define('KickedMember', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: 'room_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    kickedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'kicked_at' }
}, {
    tableName: 'kicked_members',
    timestamps: false,
    indexes: [{ unique: true, fields: ['room_id', 'user_id'] }]
});

module.exports = KickedMember;