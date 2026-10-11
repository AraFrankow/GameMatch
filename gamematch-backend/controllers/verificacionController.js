const fs = require('fs');
const path = require('path');
const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');

// Cliente de AWS Rekognition
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const verificarEdadUsuario = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { imagen } = req.body;

    if (!imagen) {
      return res.status(400).json({ exito: false, message: 'No se recibió ninguna imagen.' });
    }

    // 1. Convertir Base64 a Buffer binario
    const base64Data = imagen.replace(/^data:image\/\w+;base64,/, '');
    const bufferImagen = Buffer.from(base64Data, 'base64');

    // 2. Consulta a AWS Rekognition
    console.log('Analizando rostro con AWS Rekognition...');
    const command = new DetectFacesCommand({
      Image: { Bytes: bufferImagen },
      Attributes: ['ALL'],
    });

    const awsResponse = await rekognitionClient.send(command);

    if (!awsResponse.FaceDetails || awsResponse.FaceDetails.length === 0) {
      return res.status(400).json({
        exito: false,
        message: 'No se detectó ningún rostro en la foto. Enfocate bien frente a la cámara y asegurate de tener buena luz.',
      });
    }

    // 3. Obtener estimación de edad
    const faceDetail = awsResponse.FaceDetails[0];
    const { Low: ageMin, High: ageMax } = faceDetail.AgeRange;
    const edadEstimadaIA = Math.round((ageMin + ageMax) / 2);
    const esMayorIA = edadEstimadaIA >= 18;

    console.log(`AWS Rekognition detectó: ${edadEstimadaIA} años (Rango: ${ageMin} - ${ageMax})`);

    // Guardar imagen localmente
    const dirVerificaciones = path.join(__dirname, '../uploads/verificaciones');
    if (!fs.existsSync(dirVerificaciones)) {
      fs.mkdirSync(dirVerificaciones, { recursive: true });
    }
    const fileName = `verificacion_user_${usuario.id}_${Date.now()}.jpg`;
    const filePath = path.join(dirVerificaciones, fileName);
    fs.writeFileSync(filePath, bufferImagen);
    const rutaImagenLocal = `/uploads/verificaciones/${fileName}`;

    // 4. Determinar el nuevo rango_edad según el cálculo de AWS
    let nuevoRangoEdad = usuario.rango_edad;

    if (!esMayorIA) {
      nuevoRangoEdad = 'menor_18';
    } else {
      // Si antes era menor o no tenía rango, lo asignamos al rango 18-25 por defecto
      if (!usuario.rango_edad || usuario.rango_edad === 'menor_18') {
        nuevoRangoEdad = '18_25';
      }
    }

    // Determinar mensaje descriptivo para el usuario
    let mensajeResultado = `¡Rostro verificado con éxito (${edadEstimadaIA} años)!`;

    if (usuario.rango_edad && usuario.rango_edad !== nuevoRangoEdad) {
      if (nuevoRangoEdad === 'menor_18') {
        mensajeResultado = `Verificación completada (${edadEstimadaIA} años). Tu perfil fue reasignado al rango Menor de 18 para mayor seguridad.`;
      } else {
        mensajeResultado = `Verificación completada (${edadEstimadaIA} años). Se actualizó tu rango de edad a Mayor de 18.`;
      }
    }

    // 5. Actualizar en Base de Datos
    await usuario.update({
      verificado: true,
      rango_edad: nuevoRangoEdad,
      edad_estimada: edadEstimadaIA,
      foto_verificacion: rutaImagenLocal
    });

    return res.json({
      exito: true,
      verificado: true,
      rango_edad: nuevoRangoEdad,
      rangoEdad: nuevoRangoEdad,
      edad_estimada: edadEstimadaIA,
      edadEstimada: edadEstimadaIA,
      message: mensajeResultado,
      fotoUrl: rutaImagenLocal
    });

  } catch (error) {
    console.error('Error al procesar con AWS Rekognition:', error);
    return res.status(500).json({
      exito: false,
      message: `Error al procesar la verificación con AWS: ${error.message}`
    });
  }
};

module.exports = { verificarEdadUsuario };