const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const IntegracionSteam = sequelize.define('IntegracionSteam', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  steam_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  steam_url: { type: DataTypes.STRING(255), allowNull: true },
  vinculado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'integraciones_steam', timestamps: false });
module.exports = IntegracionSteam;
