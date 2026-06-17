const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // 기존 sequelize 인스턴스 경로에 맞게 수정

const TravelRoom = sequelize.define('TravelRoom', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roomCode: { type: DataTypes.STRING(10), unique: true, allowNull: false, field: 'room_code' },
    roomName: { type: DataTypes.STRING(100), defaultValue: '우리들의 안전 여행 방', field: 'room_name' },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
    expiresAt: { type: DataTypes.DATE, field: 'expires_at' }
}, {
    tableName: 'travel_rooms',
    timestamps: false
});

module.exports = TravelRoom;