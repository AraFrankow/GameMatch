const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IntegracionSteam = sequelize.define(
  'IntegracionSteam',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    steam_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    steam_username: { type: DataTypes.STRING(100), allowNull: true },
    steam_url: { type: DataTypes.STRING(255), allowNull: true },
    jugando_ahora: { type: DataTypes.STRING(100), allowNull: true },
    total_juegos: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    top_juegos: { type: DataTypes.TEXT, allowNull: true },
    vinculado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: 'integraciones_steam', timestamps: false }
);

module.exports = IntegracionSteam;