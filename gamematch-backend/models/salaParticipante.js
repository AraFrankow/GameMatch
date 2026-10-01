const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SalaParticipante = sequelize.define('SalaParticipante', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sala_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'sala_participantes', timestamps: false, indexes: [{ unique: true, fields: ['sala_id', 'usuario_id'] }] });
module.exports = SalaParticipante;
