const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Notificacion = sequelize.define('Notificacion', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tipo: { type: DataTypes.ENUM('mensaje_nuevo', 'invitacion_sala', 'sistema'), allowNull: false },
  contenido: { type: DataTypes.STRING(255), allowNull: false },
  leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'notificaciones', timestamps: true, updatedAt: false });
module.exports = Notificacion;
