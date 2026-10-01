const { Op } = require('sequelize');
const { Usuario, UsuarioPlataforma, UsuarioJuego, Juego, IntegracionSteam, IntegracionRiot } = require('../models');
const { obtenerIdsBloqueados } = require('./bloqueoController');
const { calcularReputacionBulk } = require('../utils/reputacion');

const MODOS_JUEGO_VALIDOS = ['competitivo', 'casual', 'ambos'];
const RANGOS_EDAD_VALIDOS = ['menor_18', '18_25', '26_35', '36_mas'];
const PLATAFORMAS_VALIDAS = ['pc', 'consola', 'mobile'];

const buscar = async (req, res) => {
  try {
    const { juego_id, modo_juego, rango_edad, usa_microfono, plataforma, verificados, reputacion_min, rol } = req.query;

    const usaFiltroPremium = verificados !== undefined || reputacion_min !== undefined || rol !== undefined;
    if (usaFiltroPremium && !req.usuario.es_premium) {
      return res.status(403).json({ error: 'Estos filtros son exclusivos para usuarios premium' });
    }

    if (modo_juego && !MODOS_JUEGO_VALIDOS.includes(modo_juego)) {
      return res.status(400).json({ error: `modo_juego debe ser: ${MODOS_JUEGO_VALIDOS.join(', ')}` });
    }
    if (rango_edad && !RANGOS_EDAD_VALIDOS.includes(rango_edad)) {
      return res.status(400).json({ error: `rango_edad debe ser: ${RANGOS_EDAD_VALIDOS.join(', ')}` });
    }
    if (plataforma && !PLATAFORMAS_VALIDAS.includes(plataforma)) {
      return res.status(400).json({ error: `plataforma debe ser: ${PLATAFORMAS_VALIDAS.join(', ')}` });
    }
    if (rol && !juego_id) {
      return res.status(400).json({ error: 'El filtro rol necesita juego_id tambien' });
    }

    const idsBloqueados = await obtenerIdsBloqueados(req.usuario.id);
    const whereUsuario = {
      id: { [Op.notIn]: [req.usuario.id, ...idsBloqueados] },
      suspendido: false
    };

    if (modo_juego) {
      whereUsuario.modo_juego = modo_juego === 'ambos' ? { [Op.in]: MODOS_JUEGO_VALIDOS } : { [Op.in]: [modo_juego, 'ambos'] };
    }
    if (rango_edad) whereUsuario.rango_edad = rango_edad;
    if (usa_microfono !== undefined) whereUsuario.usa_microfono = usa_microfono === 'true';

    if (verificados === 'true') {
      const [conSteam, conRiot] = await Promise.all([
        IntegracionSteam.findAll({ attributes: ['usuario_id'], raw: true }),
        IntegracionRiot.findAll({ attributes: ['usuario_id'], raw: true }),
      ]);
      const idsVerificados = [...new Set([...conSteam, ...conRiot].map((r) => r.usuario_id))];
      whereUsuario.id = { ...whereUsuario.id, [Op.in]: idsVerificados };
    }

    const include = [
      {
        model: UsuarioPlataforma,
        as: 'plataformas',
        attributes: ['plataforma'],
        required: !!plataforma,
        where: plataforma ? { plataforma } : undefined
      },
      {
        model: UsuarioJuego,
        as: 'usuarioJuegos',
        attributes: ['horas_steam', 'rol_preferido'],
        required: !!juego_id,
        where: juego_id ? { juego_id, ...(rol ? { rol_preferido: rol } : {}) } : undefined,
        include: [{ model: Juego, as: 'juego', attributes: ['id', 'nombre', 'imagen_url', 'genero'] }]
      },
    ];

    const usuarios = await Usuario.findAll({
      where: whereUsuario,
      attributes: { exclude: ['password_hash'] },
      include,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const ids = usuarios.map((u) => u.id);
    const reputaciones = await calcularReputacionBulk(ids);

    let resultado = usuarios.map((u) => {
      const plano = u.toJSON();
      const rep = reputaciones.get(u.id) || { positivos: 0, negativos: 0, porcentaje: null };
      return {
        id: plano.id,
        username: plano.username,
        foto_perfil: plano.foto_perfil,
        rango_edad: plano.rango_edad,
        usa_microfono: plano.usa_microfono,
        modo_juego: plano.modo_juego,
        estado: plano.estado,
        es_premium: plano.es_premium,
        reputacion_porcentaje: rep.porcentaje,
        plataformas: (plano.plataformas || []).map((p) => p.plataforma),
        juegos: (plano.usuarioJuegos || [])
          .filter((uj) => uj.juego)
          .map((uj) => ({ id: uj.juego.id, nombre: uj.juego.nombre, rol_preferido: uj.rol_preferido })),
      };
    });

    if (reputacion_min !== undefined) {
      const minimo = Number(reputacion_min);
      if (!Number.isNaN(minimo) && minimo >= 0 && minimo <= 100) {
        resultado = resultado.filter((u) => u.reputacion_porcentaje !== null && u.reputacion_porcentaje >= minimo);
      }
    }

    return res.json({ resultados: resultado, total: resultado.length });
  } catch (err) {
    console.error('Error en buscar:', err);
    return res.status(500).json({ error: 'Error al buscar usuarios' });
  }
};

module.exports = { buscar };
