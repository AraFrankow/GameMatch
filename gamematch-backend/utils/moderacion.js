const PALABRAS_TOXICAS = {
  insulto: ['idiota', 'imbecil', 'estupido', 'estupida', 'inutil', 'basura', 'pedazo de mierda', 'sos un desastre', 'no sirves para nada', 'sos un inutil', 'andate a la mierda', 'la concha de tu madre', 'hijo de puta', 'hija de puta', 'pelotudo', 'pelotuda', 'boludo de mierda', 'forro', 'forra', 'asqueroso', 'asquerosa', 'sos un asco'],
  acoso: ['te voy a encontrar', 'se donde vives', 'te voy a arruinar', 'nadie te quiere', 'deberias desaparecer', 'matate', 'suicidate', 'nadie te va a extrañar'],
  discriminacion: ['muerete puto', 'de mierda por ser mujer', 'las mujeres no saben jugar', 'vuelvete a tu pais', 'gente como vos no deberia', 'discapacitado mental'],
  amenaza: ['te voy a matar', 'te voy a pegar', 'te voy a cagar a trompadas', 'cuidate cuando salgas'],
};
const SEVERIDAD = { insulto: 0.6, acoso: 0.9, discriminacion: 0.85, amenaza: 0.95 };
const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's');
const analizarToxicidad = (texto) => {
  const normalizado = normalizar(texto);
  let scoreMax = 0, categoriaDetectada = null;
  for (const [categoria, palabras] of Object.entries(PALABRAS_TOXICAS)) {
    for (const palabra of palabras) {
      if (normalizado.includes(normalizar(palabra))) {
        const score = SEVERIDAD[categoria];
        if (score > scoreMax) { scoreMax = score; categoriaDetectada = categoria; }
      }
    }
  }
  return { score: scoreMax, categoria: categoriaDetectada };
};
const UMBRAL_NORMAL = 0.6, UMBRAL_CON_MENOR = 0.4;
const superaUmbral = (score, hayMenorEnConversacion) => score >= (hayMenorEnConversacion ? UMBRAL_CON_MENOR : UMBRAL_NORMAL);
module.exports = { analizarToxicidad, superaUmbral, UMBRAL_NORMAL, UMBRAL_CON_MENOR };
