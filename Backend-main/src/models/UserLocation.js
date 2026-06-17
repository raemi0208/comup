const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserLocation = sequelize.define('UserLocation', {
    // 기존 Users 테이블의 id에 맞춰 INTEGER로 확정합니다.
    userId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        field: 'user_id' 
    },
    
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: 'room_id' },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' }
}, {
    tableName: 'user_locations',
    timestamps: false
});

module.exports = UserLocation;