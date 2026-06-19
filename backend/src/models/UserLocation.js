const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('Location', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true // 한 사용자당 하나의 최신 위치만 기록
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false
        }
    }, {
        timestamps: true // updatedAt을 자동으로 관리하여 프론트엔드의 수신 시간으로 활용
    });
};