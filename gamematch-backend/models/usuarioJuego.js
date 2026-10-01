const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UsuarioJuego = sequelize.define('UsuarioJuego', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  juego_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  horas_steam: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  rol_preferido: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'usuario_juegos', timestamps: false, indexes: [{ unique: true, fields: ['usuario_id', 'juego_id'] }] });
module.exports = UsuarioJuego;
