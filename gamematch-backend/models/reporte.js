const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Reporte = sequelize.define('Reporte', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  reportador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reportado_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  motivo: { type: DataTypes.ENUM('lenguaje_inapropiado', 'acoso', 'spam', 'otro'), allowNull: false },
  comentario: { type: DataTypes.TEXT, allowNull: true },
  estado: { type: DataTypes.ENUM('pendiente', 'revisado', 'desestimado'), allowNull: false, defaultValue: 'pendiente' },
}, { tableName: 'reportes', timestamps: true, updatedAt: false });
module.exports = Reporte;
