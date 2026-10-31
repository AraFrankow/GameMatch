require('dotenv').config();
const Groq = require('groq-sdk');
const Filter = require('bad-words-es');
const { Reporte } = require('../models');

const filter = new Filter();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODISMOS_GAMING = [
  'boludo', 'boluda', 'pelotudo', 'pelotuda', 'manco', 'manca', 
  'pt', 'trolo', 'trola', 'forro', 'forra', 'concha', 'lpm', 
  'puto', 'puta', 'cago', 'mierda', 'repario'
];

const censurarConAPI = async (texto, emisorId = null) => {
  if (!texto || !texto.trim()) return texto;

  // 1. FILTRO LOCAL
  let textoCensurado = texto;
  try {
    textoCensurado = filter.clean(texto);
  } catch (err) {
    console.error('Error en filtro local bad-words-es:', err.message);
  }

  MODISMOS_GAMING.forEach((palabra) => {
    const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
    textoCensurado = textoCensurado.replace(regex, (match) => '*'.repeat(match.length));
  });

  // 2. FILTRO DE IA (GROQ)
  try {
    const respuesta = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Eres un moderador de chat de videojuegos. Si el mensaje contiene acoso grave, amenazas de muerte o doxxing responde "UNSAFE". De lo contrario responde "SAFE".'
        },
        { role: 'user', content: texto }
      ]
    });

    const resultadoIA = respuesta.choices?.[0]?.message?.content?.trim();
    console.log(`🤖 IA Moderación: "${texto}" -> [${resultadoIA}]`);

    if (resultadoIA && resultadoIA.toUpperCase().includes('UNSAFE')) {
      if (emisorId) {
        await Reporte.create({
          reportador_id: 1,
          reportado_id: emisorId,
          motivo: 'Toxicidad grave / Amenazas (IA)',
          comentario: `Detectado por IA: "${texto}"`,
          descripcion: texto,
          evidencia_chat: texto,
          estado: 'PENDIENTE'
        }).catch(err => console.error('Error al guardar reporte automático:', err.message));
      }

      return "[Mensaje bloqueado por comportamiento tóxico]";
    }

    return textoCensurado;

  } catch (err) {
    console.error('Error en la API de Groq:', err.message);
    return textoCensurado;
  }
};

module.exports = { censurarConAPI };