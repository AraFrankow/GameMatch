const Calificacion = require('../models/calificacion');
const Usuario = require('../models/usuario');
const Sala = require('../models/sala');
const SalaParticipante = require('../models/salaParticipante');

exports.calificarJugador = async (req, res) => {
  try {
    const evaluador_id = req.usuario.id;
    const evaluado_id = parseInt(req.params.id, 10);
    const { tipo, etiqueta, comentario } = req.body;

    if (evaluador_id === evaluado_id) {
      return res.status(400).json({ error: 'No podés calificarte a vos mismo' });
    }

    const chatCompartido = await SalaParticipante.findOne({
      where: { usuario_id: evaluador_id },
      include: [
        {
          model: Sala,
          as: 'sala',
          where: { tipo: 'privada' },
          required: true,
          include: [
            {
              model: SalaParticipante,
              as: 'salaParticipantes',
              where: { usuario_id: evaluado_id },
              required: true,
            },
          ],
        },
      ],
    });

    if (!chatCompartido) {
      return res.status(403).json({
        error: 'Solo podés calificar a jugadores con los que hayas iniciado un chat privado',
      });
    }

    const [calificacion, creada] = await Calificacion.findOrCreate({
      where: { evaluador_id, evaluado_id },
      defaults: { tipo, etiqueta, comentario },
    });

    if (!creada) {
      calificacion.tipo = tipo;
      calificacion.etiqueta = etiqueta;
      calificacion.comentario = comentario;
      await calificacion.save();
    }

    const total = await Calificacion.count({ where: { evaluado_id } });
    const positivas = await Calificacion.count({
      where: { evaluado_id, tipo: 'positiva' },
    });

    const reputacionPorcentaje = total > 0 ? Math.round((positivas / total) * 100) : 100;

    await Usuario.update(
      { reputacion_porcentaje: reputacionPorcentaje },
      { where: { id: evaluado_id } }
    );

    return res.json({
      exito: true,
      mensaje: 'Calificación guardada exitosamente',
      reputacion_porcentaje: reputacionPorcentaje,
    });
  } catch (error) {
    console.error('Error al calificar jugador:', error);
    return res.status(500).json({ error: 'Error interno al procesar la calificación' });
  }
};