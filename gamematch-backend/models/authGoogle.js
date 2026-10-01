const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AuthGoogle = sequelize.define('AuthGoogle', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  google_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  email_google: { type: DataTypes.STRING(100), allowNull: false },
}, { tableName: 'auth_google', timestamps: true, updatedAt: false });
module.exports = AuthGoogle;
