const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sala = sequelize.define('Sala', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  creador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: true },
  tipo: { type: DataTypes.ENUM('privada', 'grupal'), allowNull: false, defaultValue: 'privada' },
  max_participantes: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 2 },
}, { tableName: 'salas', timestamps: true, updatedAt: false });
module.exports = Sala;
