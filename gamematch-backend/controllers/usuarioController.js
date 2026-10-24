const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
const { Usuario, IntegracionRiot, IntegracionSteam } = require('../models');
const { calcularSinergiaDuo } = require('../utils/sinergia');

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const eliminarCuenta = async (req, res) => {
  try { 
    await req.usuario.destroy(); 
    return res.json({ ok: true, mensaje: 'Cuenta eliminada correctamente' }); 
  } catch (err) { 
    console.error('Error en eliminarCuenta:', err); 
    return res.status(500).json({ error: 'Error al eliminar la cuenta' }); 
  }
};

const safeParseJson = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const obtenerPortadaSteamHD = (juegoA, juegoB) => {
  const candidatos = [
    juegoB?.icono, juegoB?.imagen_url,
    juegoA?.icono, juegoA?.imagen_url
  ].filter(Boolean);

  const portadaOficial = candidatos.find(url => url.includes('header.jpg') || url.includes('capsule'));
  if (portadaOficial) return portadaOficial;

  for (const url of candidatos) {
    const match = url.match(/\/apps\/(\d+)\//);
    if (match && match[1]) {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${match[1]}/header.jpg`;
    }
  }

  return candidatos[0] || null;
};

const obtenerPerfilPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioRaw = await Usuario.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: IntegracionRiot, as: 'riot' },
        { model: IntegracionSteam, as: 'steam' }
      ]
    });

    if (!usuarioRaw) {
      return res.status(404).json({ exito: false, error: 'Usuario no encontrado' });
    }

    const u = usuarioRaw.toJSON();

    if (u.steam) {
      u.steam.top_juegos = safeParseJson(u.steam.top_juegos);
    }

    let sinergia_porcentaje = 50;
    let juegos_en_comun = [];

    if (req.usuario && String(req.usuario.id) !== String(id)) {
      const miRiot = await IntegracionRiot.findOne({ where: { usuario_id: req.usuario.id } });
      const miSteam = await IntegracionSteam.findOne({ where: { usuario_id: req.usuario.id } });

      const solicitante = {
        riot: miRiot ? miRiot.toJSON() : null,
        steam: miSteam ? miSteam.toJSON() : null
      };

      sinergia_porcentaje = calcularSinergiaDuo(solicitante, {
        riot: u.riot,
        steam: u.steam,
        reputacion_porcentaje: u.reputacion_porcentaje
      });

      const misJuegosSteam = safeParseJson(miSteam?.top_juegos);
      const susJuegosSteam = u.steam?.top_juegos || [];

      misJuegosSteam.forEach(miJuego => {
        const coincidencia = susJuegosSteam.find(
          sj => sj.nombre?.toLowerCase().trim() === miJuego.nombre?.toLowerCase().trim()
        );

        if (coincidencia) {
          juegos_en_comun.push({
            nombre: miJuego.nombre,
            icono: obtenerPortadaSteamHD(miJuego, coincidencia),
            mis_horas: miJuego.horas,
            sus_horas: coincidencia.horas
          });
        }
      });
    }

    const usuario = {
      ...u,
      es_premium: Boolean(u.es_premium || u.esPremium || Number(u.es_premium) === 1),
      verificado: Boolean(u.verificado || u.estaVerificado),
      sinergia_porcentaje,
      juegos_en_comun
    };

    return res.json({
      exito: true,
      usuario,
      juegos_en_comun,
      riot: u.riot || null,
      steam: u.steam || null
    });
  } catch (error) {
    console.error('Error en obtenerPerfilPorId:', error);
    return res.status(500).json({ exito: false, error: 'Error interno del servidor' });
  }
};

const verificarCamara = async (req, res) => {
  try {
    const { imagen } = req.body;

    if (!imagen) {
      return res.status(400).json({
        exito: false,
        message: 'No se recibió ninguna foto de la cámara.'
      });
    }

    const base64Data = imagen.replace(/^data:image\/\w+;base64,/, '');
    const bufferImagen = Buffer.from(base64Data, 'base64');

    const command = new DetectFacesCommand({
      Image: { Bytes: bufferImagen },
      Attributes: ['ALL']
    });

    const rekognitionResponse = await rekognition.send(command);

    if (!rekognitionResponse.FaceDetails || rekognitionResponse.FaceDetails.length === 0) {
      return res.status(400).json({
        exito: false,
        message: 'No se detectó ningún rostro en la imagen. Por favor, asegúrate de tener buena iluminación y enfocar tu cara.'
      });
    }

    const faceDetail = rekognitionResponse.FaceDetails[0];
    const ageRange = faceDetail.AgeRange || { Low: 18, High: 24 };
    const edadEstimada = Math.round((ageRange.Low + ageRange.High) / 2);
    const ageMin = ageRange.Low;
    const ageMax = ageRange.High;

    const rangoEdadDeclarado = req.usuario?.rango_edad;
    const esMayorDeclarado = rangoEdadDeclarado && rangoEdadDeclarado !== 'menor_18';
    const esMayorIA = edadEstimada >= 18;

    let statusCuenta = 'ACTIVA';
    let entorno = esMayorIA ? 'mayores' : 'menores';
    let mensajeResultado = '';

    if (esMayorDeclarado === esMayorIA) {
      statusCuenta = 'ACTIVA';
      mensajeResultado = `Rostro verificado correctamente (${edadEstimada} años). Rango verificado para entorno de ${entorno}.`;
    } 
    else if (!esMayorDeclarado && esMayorIA) {
      if (ageMin >= 18) {
        statusCuenta = 'BLOQUEADA';
        if (req.usuario) {
          req.usuario.verificado = false;
          await req.usuario.save();
        }
        return res.status(403).json({
          exito: false,
          message: `Verificación fallida: Se detectó un perfil adulto (${edadEstimada} años) intentando ingresar a entorno de menores.`,
          edad_estimada: edadEstimada
        });
      } else {
        statusCuenta = 'ACTIVA';
        entorno = 'menores';
        mensajeResultado = `Verificación aprobada en zona de tolerancia (${edadEstimada} años). Asignado a entorno de menores.`;
      }
    } 
    else if (esMayorDeclarado && !esMayorIA) {
      if (ageMax >= 18) {
        statusCuenta = 'ACTIVA';
        entorno = 'mayores';
        mensajeResultado = `Verificación aprobada en zona límite (${edadEstimada} años). Se mantiene en entorno de mayores.`;
      } else {
        statusCuenta = 'RESTRINGIDA_MENOR';
        entorno = 'menores';
        if (req.usuario) {
          req.usuario.rango_edad = 'menor_18';
        }
        mensajeResultado = `Rango reajustado: Se detectó un menor de edad (${edadEstimada} años). Cuenta asignada a entorno infantil seguro.`;
      }
    }

    const usuarioId = req.usuario?.id || Date.now();
    const nombreArchivo = `verificacion_${usuarioId}_${Date.now()}.jpg`;
    const carpetaDestino = path.join(__dirname, '../uploads/verificaciones');
    
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }
    
    fs.writeFileSync(path.join(carpetaDestino, nombreArchivo), bufferImagen);
    const rutaImagenLocal = `/uploads/verificaciones/${nombreArchivo}`;

    if (req.usuario) {
      req.usuario.verificado = true;
      req.usuario.foto_verificacion = rutaImagenLocal;
      req.usuario.edad_estimada = edadEstimada;
      await req.usuario.save();
    }

    return res.json({
      exito: true,
      message: mensajeResultado,
      mensaje: mensajeResultado,
      verificado: true,
      status_cuenta: statusCuenta,
      entorno: entorno,
      edad_estimada: edadEstimada,
      edadEstimada: edadEstimada,
      es_mayor_de_edad: entorno === 'mayores',
      fotoUrl: rutaImagenLocal
    });

  } catch (err) {
    console.error('Error en verificarCamara:', err.message);
    return res.status(500).json({
      exito: false,
      message: `Error interno al procesar la verificación con AWS Rekognition: ${err.message}`
    });
  }
};

const obtenerPremiumDestacados = async (req, res) => {
  try {
    const usuariosPremium = await Usuario.findAll({
      where: { es_premium: true },
      limit: 10,
      attributes: [
        'id', 
        'username', 
        'foto_perfil', 
        'rango_edad', 
        'es_premium', 
        'verificado'
      ],
      order: [Sequelize.literal('RAND()')]
    });

    return res.json({ exito: true, usuarios: usuariosPremium });
  } catch (error) {
    console.error('Error al obtener usuarios premium destacados:', error);
    return res.status(500).json({ exito: false, error: 'Error al obtener destacados' });
  }
};

module.exports = { 
  eliminarCuenta,
  obtenerPerfilPorId,
  verificarCamara,
  obtenerPremiumDestacados,
};