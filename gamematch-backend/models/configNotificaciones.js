const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ConfigNotificaciones = sequelize.define('ConfigNotificaciones', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  mensajes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  invitaciones: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sistema: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'config_notificaciones', timestamps: false });
module.exports = ConfigNotificaciones;
