const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: true },
  foto_perfil: { type: DataTypes.STRING(500), allowNull: true },
  rango_edad: { type: DataTypes.ENUM('menor_18', '18_25', '26_35', '36_mas'), allowNull: false },
  usa_microfono: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  modo_juego: { type: DataTypes.ENUM('competitivo', 'casual', 'ambos'), allowNull: false, defaultValue: 'ambos' },
  estado: { type: DataTypes.ENUM('disponible', 'ocupado', 'en_partida'), allowNull: false, defaultValue: 'disponible' },
  es_premium: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  rol: { type: DataTypes.ENUM('usuario', 'admin'), allowNull: false, defaultValue: 'usuario' },
  suspendido: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'usuarios', timestamps: true });

module.exports = Usuario;
