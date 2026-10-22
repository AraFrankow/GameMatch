const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IntegracionRiot = sequelize.define('IntegracionRiot', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  riot_puuid: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  riot_username: { type: DataTypes.STRING(100), allowNull: false },
  region: { type: DataTypes.STRING(20), allowNull: false },
  
  // Nivel e Identidad visual de Riot
  nivel_invocador: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  icono_perfil_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

  // League of Legends - Detalle de Rango
  rango_lol: { type: DataTypes.STRING(50), allowNull: true },
  lol_tier: { type: DataTypes.STRING(20), allowNull: true },
  lol_rank: { type: DataTypes.STRING(10), allowNull: true },
  lol_lp: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  lol_wins: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
  lol_losses: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
  lol_posicion_principal: { 
    type: DataTypes.ENUM('TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'), 
    allowNull: true 
  },

  // Valorant
  rango_valorant: { type: DataTypes.STRING(50), allowNull: true },

  vinculado_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  ultima_sincronizacion: { type: DataTypes.DATE, allowNull: true }
}, { 
  tableName: 'integraciones_riot', 
  timestamps: false 
});

module.exports = IntegracionRiot;