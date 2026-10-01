const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Reputacion = sequelize.define('Reputacion', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  evaluador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  evaluado_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  voto: { type: DataTypes.ENUM('positivo', 'negativo'), allowNull: false },
}, { tableName: 'reputacion', timestamps: true, updatedAt: false, indexes: [{ unique: true, fields: ['evaluador_id', 'evaluado_id'] }] });
module.exports = Reputacion;
