const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Juego = sequelize.define('Juego', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  imagen_url: { type: DataTypes.STRING(500), allowNull: true },
  genero: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'juegos', timestamps: true, updatedAt: false });
module.exports = Juego;
