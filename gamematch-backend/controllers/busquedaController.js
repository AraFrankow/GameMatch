const { Op } = require('sequelize');
const { Usuario, UsuarioPlataforma, UsuarioJuego, Juego, IntegracionRiot, IntegracionSteam } = require('../models');
const { calcularSinergiaDuo } = require('../utils/sinergia');
const { calcularReputacionBulk } = require('../utils/reputacion');
const { obtenerIdsBloqueados } = require('./bloqueoController');

const RANGOS_ORDEN = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

const obtenerReputacionUnificada = (mapa, id) => {
  if (!mapa) return null;
  let res = null;

  if (typeof mapa.get === 'function') {
    res = mapa.get(id) ?? mapa.get(String(id)) ?? mapa.get(Number(id));
  } else {
    res = mapa[id] ?? mapa[String(id)] ?? mapa[Number(id)];
  }

  if (res === null || res === undefined) return null;
  if (typeof res === 'number') return res;

  return res.porcentaje ?? res.porcentajePositivo ?? res.porcentaje_positivo ?? res.reputacion ?? res.valor ?? null;
};

const buscarCompaneros = async (req, res) => {
  try {
    const usuarioSolicitante = req.usuario;
    const esPremium = Boolean(usuarioSolicitante.es_premium);

    const idsBloqueados = await obtenerIdsBloqueados(usuarioSolicitante.id);
    const idsExcluidos = [usuarioSolicitante.id, ...idsBloqueados];

    const {
      juego_id,
      plataforma,
      modo_juego,
      rango_edad,
      rango_lol,
      winrate_min,
      sinergia_min,
      rol_preferido,
      reputacion_min,
      juego_steam,
      estado
    } = req.query;

    const whereUsuario = {
      id: { [Op.notIn]: idsExcluidos },
      suspendido: false,
    };

    if (modo_juego) whereUsuario.modo_juego = modo_juego;
    if (rango_edad) whereUsuario.rango_edad = rango_edad;
    if (estado) {
      whereUsuario.estado = estado;
    }

    if (juego_steam && juego_steam.trim() !== '') {
      const juegosCoincidentes = await Juego.findAll({
        where: {
          nombre: { [Op.like]: `%${juego_steam.trim()}%` }
        },
        attributes: ['id'],
        raw: true
      });

      const idsJuegos = juegosCoincidentes.map((j) => j.id);

      if (idsJuegos.length > 0) {
        const usuarioJuegos = await UsuarioJuego.findAll({
          where: { juego_id: { [Op.in]: idsJuegos } },
          attributes: ['usuario_id'],
          raw: true
        });

        const idsUsuariosConJuego = [...new Set(usuarioJuegos.map((uj) => uj.usuario_id).filter(Boolean))];

        if (idsUsuariosConJuego.length > 0) {
          whereUsuario.id = {
            [Op.notIn]: idsExcluidos,
            [Op.in]: idsUsuariosConJuego
          };
        } else {
          whereUsuario.id = -1;
        }
      } else {
        whereUsuario.id = -1;
      }
    }

    const includes = [
      {
        model: UsuarioPlataforma,
        as: 'plataformas',
        attributes: ['plataforma'],
        required: false,
      },
      {
        model: UsuarioJuego,
        as: 'usuarioJuegos',
        attributes: ['horas_steam', 'rol_preferido'],
        required: false,
        include: [{ model: Juego, as: 'juego' }],
      },
      {
        model: IntegracionRiot,
        as: 'riot',
        required: false,
      },
      {
        model: IntegracionSteam,
        as: 'steam',
        required: false,
      },
    ];

    const candidatosRaw = await Usuario.findAll({
      where: whereUsuario,
      attributes: { exclude: ['password_hash'] },
      include: includes,
    });

    const ids = candidatosRaw.map((u) => u.id);
    const reputacionesMap = await calcularReputacionBulk(ids);

    const miRiot = await IntegracionRiot.findOne({ where: { usuario_id: usuarioSolicitante.id } });
    const miSteam = await IntegracionSteam.findOne({ where: { usuario_id: usuarioSolicitante.id } });

    const perfilSolicitante = {
      ...usuarioSolicitante.toJSON(),
      riot: miRiot ? miRiot.toJSON() : null,
      steam: miSteam ? miSteam.toJSON() : null,
    };

    let resultados = candidatosRaw.map((u) => {
      const plano = u.toJSON();

      const rawRep = obtenerReputacionUnificada(reputacionesMap, u.id);

      let repNum = null;
      if (rawRep !== null && rawRep !== undefined) {
        const parsed = parseFloat(String(rawRep).replace('%', '').trim());
        if (!isNaN(parsed)) {
          repNum = parsed <= 1 && parsed > 0 ? parsed * 100 : parsed;
        }
      }

      plano.reputacion_porcentaje = repNum;

      const sinergiaObj = calcularSinergiaDuo(perfilSolicitante, plano);

      const valorGlobal =
        typeof sinergiaObj === 'object' && sinergiaObj !== null
          ? sinergiaObj.global
          : Number(sinergiaObj) || 50;

      plano.sinergia = sinergiaObj;
      plano.sinergia_porcentaje = valorGlobal;
      plano.sinergia_riot = sinergiaObj?.riot ?? null;
      plano.sinergia_steam = sinergiaObj?.steam ?? null;

      let winrate = 0;
      if (plano.riot && (plano.riot.lol_wins > 0 || plano.riot.lol_losses > 0)) {
        const total = plano.riot.lol_wins + plano.riot.lol_losses;
        winrate = Math.round((plano.riot.lol_wins / total) * 100);
      }
      plano.lol_winrate = winrate;

      return plano;
    });

    if (plataforma) {
      resultados = resultados.filter((c) =>
        (c.plataformas || []).some((p) => p.plataforma?.toLowerCase() === plataforma.toLowerCase())
      );
    }

    if (esPremium) {
      if (rango_lol) {
        const idxMin = RANGOS_ORDEN.indexOf(rango_lol.toUpperCase());
        if (idxMin !== -1) {
          resultados = resultados.filter((c) => {
            if (!c.riot || !c.riot.lol_tier) return false;
            const idxUser = RANGOS_ORDEN.indexOf(c.riot.lol_tier.toUpperCase());
            return idxUser >= idxMin;
          });
        }
      }

      if (winrate_min) {
        const minWr = Number(winrate_min);
        resultados = resultados.filter((c) => c.lol_winrate >= minWr);
      }

      if (sinergia_min) {
        const minSin = Number(sinergia_min);
        resultados = resultados.filter((c) => c.sinergia_porcentaje >= minSin);
      }

      if (rol_preferido) {
        resultados = resultados.filter((c) => {
          const tieneRolEnJuegos = (c.usuarioJuegos || []).some(
            (uj) => uj.rol_preferido?.toUpperCase() === rol_preferido.toUpperCase()
          );
          const tieneRolEnRiot = c.riot?.lol_posicion_principal?.toUpperCase() === rol_preferido.toUpperCase();
          return tieneRolEnJuegos || tieneRolEnRiot;
        });
      }

      if (reputacion_min) {
        const minRep = Number(reputacion_min);
        resultados = resultados.filter(
          (c) => c.reputacion_porcentaje !== null && c.reputacion_porcentaje !== undefined && c.reputacion_porcentaje >= minRep
        );
      }
    }

    return res.json({
      exito: true,
      total: resultados.length,
      usuarios: resultados,
    });
  } catch (err) {
    console.error('Error en buscarCompaneros:', err);
    return res.status(500).json({ error: 'Error al realizar la búsqueda' });
  }
};

module.exports = { buscarCompaneros };