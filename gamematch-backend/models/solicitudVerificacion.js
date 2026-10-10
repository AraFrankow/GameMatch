// gamematch-backend/models/SolicitudVerificacion.js
module.exports = (sequelize, DataTypes) => {
  const SolicitudVerificacion = sequelize.define('SolicitudVerificacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    foto_evidencia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    edad_declarada: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    edad_estimada_ia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_caso: {
      type: DataTypes.ENUM('BLOQUEO_POR_FRAUDE', 'REVISION_MAYOR_A_MENOR'),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'),
      defaultValue: 'PENDIENTE',
    },
  }, {
    tableName: 'SolicitudesVerificacion',
    timestamps: true,
  });

  SolicitudVerificacion.associate = (models) => {
    SolicitudVerificacion.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
    });
  };

  return SolicitudVerificacion;
};