const { Usuario, UsuarioPlataforma, UsuarioJuego, Juego, IntegracionRiot, IntegracionSteam } = require('../models');
const { Op } = require('sequelize');
const { calcularSinergiaDuo } = require('../utils/sinergia');
const { calcularReputacionBulk } = require('../utils/reputacion');

const RANGOS_ORDEN = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

const buscarCompaneros = async (req, res) => {
  try {
    const usuarioSolicitante = req.usuario;
    const esPremium = Boolean(usuarioSolicitante.es_premium);

    const {
      juego_id,
      plataforma,
      modo_juego,
      rango_edad,
      rango_lol,
      winrate_min,
      sinergia_min,
      rol_preferido,
    } = req.query;

    const whereUsuario = {
      id: { [Op.ne]: usuarioSolicitante.id },
      suspendido: false,
    };

    if (modo_juego) whereUsuario.modo_juego = modo_juego;
    if (rango_edad) whereUsuario.rango_edad = rango_edad;

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
    const perfilSolicitante = {
      ...usuarioSolicitante.toJSON(),
      riot: miRiot ? miRiot.toJSON() : null,
    };

    let resultados = candidatosRaw.map((u) => {
      const plano = u.toJSON();
      const rep = reputacionesMap.get(u.id) || { porcentaje: null };
      
      plano.reputacion_porcentaje = rep.porcentaje;
      plano.sinergia_porcentaje = calcularSinergiaDuo(perfilSolicitante, plano);

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