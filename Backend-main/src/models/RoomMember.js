const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RoomMember = sequelize.define('RoomMember', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: 'room_id' },
    
    // 기존 Users 테이블의 id에 맞춰 INTEGER로 확정합니다.
    userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        field: 'user_id' 
    },
    
    userName: { type: DataTypes.STRING(50), allowNull: false, field: 'user_name' },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'joined_at' }
}, {
    tableName: 'room_members',
    timestamps: false,
    indexes: [{ unique: true, fields: ['room_id', 'user_id'] }]
});

module.exports = RoomMember;