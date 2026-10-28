const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Calificacion = sequelize.define(
  'Calificacion',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    evaluador_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    evaluado_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tipo: {
      type: DataTypes.ENUM('positiva', 'negativa'),
      allowNull: false,
    },
    etiqueta: { type: DataTypes.STRING(50), allowNull: true },
    comentario: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'reputacion',
    timestamps: false,
  }
);

module.exports = Calificacion;