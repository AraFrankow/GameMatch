const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PartidaRiot = sequelize.define('PartidaRiot', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  juego: { type: DataTypes.ENUM('lol', 'valorant'), allowNull: false },
  personaje: { type: DataTypes.STRING(50), allowNull: false },
  resultado: { type: DataTypes.ENUM('victoria', 'derrota'), allowNull: false },
  kills: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  deaths: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  assists: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  duracion_min: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  jugada_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'partidas_riot', timestamps: true, updatedAt: false });
module.exports = PartidaRiot;
