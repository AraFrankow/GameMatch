const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Reporte = sequelize.define('Reporte', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  reportador_id: {type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: {model: 'usuarios', key: 'id'}},
  reportado_id: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: {model: 'usuarios', key: 'id'}},
  motivo: { type: DataTypes.ENUM('lenguaje_inapropiado', 'acoso', 'spam', 'otro'), allowNull: false },
  comentario: { type: DataTypes.TEXT, allowNull: true },
  estado: { type: DataTypes.ENUM('pendiente', 'revisado', 'desestimado'), allowNull: false, defaultValue: 'pendiente' },
  evidencia_chat: {type: DataTypes.TEXT, allowNull: true,},
}, { tableName: 'reportes', timestamps: true, updatedAt: false, underscored: true });
module.exports = Reporte;
