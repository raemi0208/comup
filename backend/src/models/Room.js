const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Room = sequelize.define('Room', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        roomName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '우리들의 안전 여행 방'
        },
        roomCode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            unique: true // 중복 없는 6자리 참여 코드
        },
        hostUserId: {
            type: DataTypes.STRING, // Supabase user.id(UUID 또는 문자열)와 매핑
            allowNull: false
        }
    }, {
        timestamps: true
    });
    return Room;
};