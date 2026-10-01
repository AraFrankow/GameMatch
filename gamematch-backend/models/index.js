const sequelize = require('../config/database');
const Usuario = require('./usuario');
const AuthGoogle = require('./authGoogle');
const Suscripcion = require('./suscripcion');
const Juego = require('./juego');
const UsuarioPlataforma = require('./usuarioPlataforma');
const UsuarioJuego = require('./usuarioJuego');
const IntegracionSteam = require('./integracionSteam');
const IntegracionRiot = require('./integracionRiot');
const Sala = require('./sala');
const SalaParticipante = require('./salaParticipante');
const Mensaje = require('./mensaje');
const Reputacion = require('./reputacion');
const HistorialCompanero = require('./historialCompanero');
const Bloqueo = require('./bloqueo');
const Reporte = require('./reporte');
const Notificacion = require('./notificacion');
const ConfigNotificaciones = require('./configNotificaciones');
const PartidaRiot = require('./partidaRiot');

Usuario.hasOne(AuthGoogle, { foreignKey: 'usuario_id', as: 'authGoogle', onDelete: 'CASCADE' });
AuthGoogle.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(Suscripcion, { foreignKey: 'usuario_id', as: 'suscripcion', onDelete: 'CASCADE' });
Suscripcion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(IntegracionSteam, { foreignKey: 'usuario_id', as: 'steam', onDelete: 'CASCADE' });
IntegracionSteam.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(IntegracionRiot, { foreignKey: 'usuario_id', as: 'riot', onDelete: 'CASCADE' });
IntegracionRiot.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(ConfigNotificaciones, { foreignKey: 'usuario_id', as: 'configNotificaciones', onDelete: 'CASCADE' });
ConfigNotificaciones.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(UsuarioPlataforma, { foreignKey: 'usuario_id', as: 'plataformas', onDelete: 'CASCADE' });
UsuarioPlataforma.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones', onDelete: 'CASCADE' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(PartidaRiot, { foreignKey: 'usuario_id', as: 'partidas', onDelete: 'CASCADE' });
PartidaRiot.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Usuario.belongsToMany(Juego, { through: UsuarioJuego, foreignKey: 'usuario_id', otherKey: 'juego_id', as: 'juegos' });
Juego.belongsToMany(Usuario, { through: UsuarioJuego, foreignKey: 'juego_id', otherKey: 'usuario_id', as: 'usuarios' });
Usuario.hasMany(UsuarioJuego, { foreignKey: 'usuario_id', as: 'usuarioJuegos', onDelete: 'CASCADE' });
UsuarioJuego.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
UsuarioJuego.belongsTo(Juego, { foreignKey: 'juego_id', as: 'juego' });
Juego.hasMany(UsuarioJuego, { foreignKey: 'juego_id', as: 'usuarioJuegos' });

Usuario.hasMany(Sala, { foreignKey: 'creador_id', as: 'salasCreadas', onDelete: 'CASCADE' });
Sala.belongsTo(Usuario, { foreignKey: 'creador_id', as: 'creador' });
Sala.belongsToMany(Usuario, { through: SalaParticipante, foreignKey: 'sala_id', otherKey: 'usuario_id', as: 'participantes' });
Usuario.belongsToMany(Sala, { through: SalaParticipante, foreignKey: 'usuario_id', otherKey: 'sala_id', as: 'salas' });
Sala.hasMany(SalaParticipante, { foreignKey: 'sala_id', as: 'salaParticipantes', onDelete: 'CASCADE' });
SalaParticipante.belongsTo(Sala, { foreignKey: 'sala_id', as: 'sala' });
SalaParticipante.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Sala.hasMany(Mensaje, { foreignKey: 'sala_id', as: 'mensajes', onDelete: 'CASCADE' });
Mensaje.belongsTo(Sala, { foreignKey: 'sala_id', as: 'sala' });
Usuario.hasMany(Mensaje, { foreignKey: 'emisor_id', as: 'mensajesEnviados', onDelete: 'CASCADE' });
Mensaje.belongsTo(Usuario, { foreignKey: 'emisor_id', as: 'emisor' });

Usuario.hasMany(Reputacion, { foreignKey: 'evaluador_id', as: 'votosEmitidos', onDelete: 'CASCADE' });
Usuario.hasMany(Reputacion, { foreignKey: 'evaluado_id', as: 'votosRecibidos', onDelete: 'CASCADE' });
Reputacion.belongsTo(Usuario, { foreignKey: 'evaluador_id', as: 'evaluador' });
Reputacion.belongsTo(Usuario, { foreignKey: 'evaluado_id', as: 'evaluado' });

Usuario.hasMany(HistorialCompanero, { foreignKey: 'usuario_id', as: 'companeros', onDelete: 'CASCADE' });
HistorialCompanero.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
HistorialCompanero.belongsTo(Usuario, { foreignKey: 'companero_id', as: 'companero' });

Usuario.hasMany(Bloqueo, { foreignKey: 'bloqueador_id', as: 'bloqueosRealizados', onDelete: 'CASCADE' });
Usuario.hasMany(Bloqueo, { foreignKey: 'bloqueado_id', as: 'bloqueosRecibidos', onDelete: 'CASCADE' });
Bloqueo.belongsTo(Usuario, { foreignKey: 'bloqueador_id', as: 'bloqueador' });
Bloqueo.belongsTo(Usuario, { foreignKey: 'bloqueado_id', as: 'bloqueado' });

Usuario.hasMany(Reporte, { foreignKey: 'reportador_id', as: 'reportesRealizados', onDelete: 'CASCADE' });
Usuario.hasMany(Reporte, { foreignKey: 'reportado_id', as: 'reportesRecibidos', onDelete: 'CASCADE' });
Reporte.belongsTo(Usuario, { foreignKey: 'reportador_id', as: 'reportador' });
Reporte.belongsTo(Usuario, { foreignKey: 'reportado_id', as: 'reportado' });

module.exports = {
  sequelize, Usuario, AuthGoogle, Suscripcion, Juego, UsuarioPlataforma, UsuarioJuego,
  IntegracionSteam, IntegracionRiot, Sala, SalaParticipante, Mensaje, Reputacion,
  HistorialCompanero, Bloqueo, Reporte, Notificacion, ConfigNotificaciones, PartidaRiot,
};
