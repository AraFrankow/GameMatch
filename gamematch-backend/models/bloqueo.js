const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Bloqueo = sequelize.define('Bloqueo', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  bloqueador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  bloqueado_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'bloqueos', timestamps: true, updatedAt: false, indexes: [{ unique: true, fields: ['bloqueador_id', 'bloqueado_id'] }] });
module.exports = Bloqueo;
