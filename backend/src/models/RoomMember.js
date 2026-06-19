const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('RoomMember', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: true
    });
};