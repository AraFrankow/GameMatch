const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UsuarioPlataforma = sequelize.define('UsuarioPlataforma', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  plataforma: { type: DataTypes.ENUM('pc', 'consola', 'mobile'), allowNull: false },
}, { tableName: 'usuario_plataformas', timestamps: false, indexes: [{ unique: true, fields: ['usuario_id', 'plataforma'] }] });
module.exports = UsuarioPlataforma;
