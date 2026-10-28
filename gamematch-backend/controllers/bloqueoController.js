const { Op } = require('sequelize');
const { Bloqueo, Usuario, Sala, SalaParticipante } = require('../models');

const bloquear = async (req, res) => {
  try {
    const bloqueado_id = Number(req.body.bloqueado_id || req.params.bloqueado_id);
    const bloqueador_id = req.usuario.id;

    if (!bloqueado_id) {
      return res.status(400).json({ error: 'bloqueado_id es obligatorio' });
    }

    if (Number(bloqueado_id) === Number(bloqueador_id)) {
      return res.status(400).json({ error: 'No podés bloquearte a vos mismo' });
    }

    const objetivo = await Usuario.findByPk(bloqueado_id);
    if (!objetivo) {
      return res.status(404).json({ error: 'Usuario a bloquear no encontrado' });
    }

    const yaExiste = await Bloqueo.findOne({
      where: { bloqueador_id, bloqueado_id: Number(bloqueado_id) }
    });

    if (yaExiste) {
      return res.status(409).json({ error: 'Ya bloqueaste a este usuario' });
    }

    const bloqueo = await Bloqueo.create({ bloqueador_id, bloqueado_id });

    try {
      const misSalas = await SalaParticipante.findAll({ where: { usuario_id: bloqueador_id } });
      const idsMisSalas = misSalas.map((s) => s.sala_id);

      const salaPrivada = await Sala.findOne({
        where: {
          id: { [Op.in]: idsMisSalas },
          tipo: 'privada'
        },
        include: [
          {
            model: SalaParticipante,
            as: 'salaParticipantes',
            where: { usuario_id: bloqueado_id },
            required: true
          }
        ]
      });

      if (salaPrivada) {
        await salaPrivada.destroy();
      }
    } catch (errSala) {
      console.error('Error al cerrar sala privada tras bloqueo:', errSala);
    }

    return res.status(201).json({ bloqueo, mensaje: 'Usuario bloqueado y chat cerrado correctamente' });
  } catch (err) {
    console.error('Error en bloquear:', err);
    return res.status(500).json({ error: 'Error al bloquear usuario' });
  }
};

const desbloquear = async (req, res) => {
  try {
    const bloqueado_id = req.params.bloqueado_id || req.body.bloqueado_id;
    const bloqueador_id = req.usuario.id;

    if (!bloqueado_id) {
      return res.status(400).json({ error: 'bloqueado_id es obligatorio' });
    }

    const eliminado = await Bloqueo.destroy({
      where: {
        bloqueador_id,
        bloqueado_id: Number(bloqueado_id)
      }
    });

    if (!eliminado) {
      return res.status(404).json({ error: 'No existe un bloqueo activo hacia este usuario' });
    }

    return res.json({ ok: true, mensaje: 'Usuario desbloqueado correctamente' });
  } catch (err) {
    console.error('Error en desbloquear:', err);
    return res.status(500).json({ error: 'Error al desbloquear usuario' });
  }
};

const listarBloqueos = async (req, res) => {
  try {
    const bloqueos = await Bloqueo.findAll({
      where: { bloqueador_id: req.usuario.id },
      include: [
        {
          model: Usuario,
          as: 'bloqueado',
          attributes: ['id', 'username', 'foto_perfil']
        }
      ]
    });
    return res.json({ bloqueos });
  } catch (err) {
    console.error('Error en listarBloqueos:', err);
    return res.status(500).json({ error: 'Error al listar bloqueos' });
  }
};

const existeBloqueoEntre = async (a, b) => {
  const idA = Number(a);
  const idB = Number(b);

  return !!(await Bloqueo.findOne({
    where: {
      [Op.or]: [
        { bloqueador_id: idA, bloqueado_id: idB },
        { bloqueador_id: idB, bloqueado_id: idA }
      ]
    }
  }));
};

const obtenerIdsBloqueados = async (usuarioId) => {
  const id = Number(usuarioId);
  const bloqueos = await Bloqueo.findAll({
    where: {
      [Op.or]: [{ bloqueador_id: id }, { bloqueado_id: id }]
    }
  });

  return bloqueos.map((b) => (b.bloqueador_id === id ? b.bloqueado_id : b.bloqueador_id));
};

module.exports = {
  bloquear,
  desbloquear,
  listarBloqueos,
  existeBloqueoEntre,
  obtenerIdsBloqueados
};