const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Suscripcion = sequelize.define('Suscripcion', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  stripe_sub_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  stripe_customer: { type: DataTypes.STRING(100), allowNull: false },
  estado: { type: DataTypes.ENUM('activa', 'cancelada', 'vencida'), allowNull: false, defaultValue: 'activa' },
  fecha_inicio: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_fin: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'suscripciones', timestamps: true, updatedAt: false });
module.exports = Suscripcion;
