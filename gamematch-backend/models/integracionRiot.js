const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const IntegracionRiot = sequelize.define('IntegracionRiot', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  riot_puuid: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  riot_username: { type: DataTypes.STRING(100), allowNull: false },
  region: { type: DataTypes.STRING(20), allowNull: false },
  rango_lol: { type: DataTypes.STRING(50), allowNull: true },
  rango_valorant: { type: DataTypes.STRING(50), allowNull: true },
  vinculado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'integraciones_riot', timestamps: false });
module.exports = IntegracionRiot;
