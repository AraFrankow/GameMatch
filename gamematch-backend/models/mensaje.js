const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Mensaje = sequelize.define('Mensaje', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sala_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  emisor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false },
  bloqueado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'mensajes', timestamps: true, updatedAt: false });
module.exports = Mensaje;
