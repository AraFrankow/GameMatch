const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const HistorialCompanero = sequelize.define('HistorialCompanero', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  companero_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  ultima_interaccion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'historial_companeros', timestamps: false, indexes: [{ unique: true, fields: ['usuario_id', 'companero_id'] }] });
module.exports = HistorialCompanero;
