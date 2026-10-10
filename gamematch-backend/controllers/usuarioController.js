const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { Usuario, IntegracionRiot, IntegracionSteam } = require('../models');

const eliminarCuenta = async (req, res) => {
    try { 
        await req.usuario.destroy(); 
        return res.json({ ok: true, mensaje: 'Cuenta eliminada correctamente' }); 
    } catch (err) { 
        console.error('Error en eliminarCuenta:', err); 
        return res.status(500).json({ error: 'Error al eliminar la cuenta' }); 
    }
};

const obtenerPerfilPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'username', 'foto_perfil', 'biografia', 'rango_edad', 'verificado']
    });

    if (!usuario) {
      return res.status(404).json({ exito: false, error: 'Usuario no encontrado' });
    }

    const riot = await IntegracionRiot?.findOne({ where: { usuario_id: id } });
    const steam = await IntegracionSteam?.findOne({ where: { usuario_id: id } });

    return res.json({
      exito: true,
      usuario,
      riot: riot || null,
      steam: steam || null
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
                message: 'No se recibió ninguna foto de la cámara'
            });
        }

        // 1. Convertir la cadena Base64 recibida del frontend a un Buffer
        const base64Data = imagen.replace(/^data:image\/\w+;base64,/, '');
        const bufferImagen = Buffer.from(base64Data, 'base64');

        // 2. Preparar el multipart/form-data para enviar a FastAPI
        const form = new FormData();
        form.append('foto', bufferImagen, {
            filename: `captura_${req.usuario?.id || 'user'}.jpg`,
            contentType: 'image/jpeg'
        });

        // 3. Petición a FastAPI
        const iaResponse = await axios.post('http://localhost:8000/verificar-edad', form, {
            headers: form.getHeaders()
        });

        const resultadoIA = iaResponse.data;

        // 4. Si FastAPI devuelve exito = false
        if (!resultadoIA.exito) {
            return res.status(400).json({
                exito: false,
                message: resultadoIA.detalle || resultadoIA.error || 'No se detectó un rostro válido.'
            });
        }

        // 5. Si no es mayor de edad
        if (!resultadoIA.es_mayor_de_edad) {
            return res.status(403).json({
                exito: false,
                message: `Verificación fallida. La IA estimó que tu edad es de ${resultadoIA.edad_estimada} años.`,
                edadEstimada: resultadoIA.edad_estimada
            });
        }

        // 6. Guardar imagen verificada en disco local
        const nombreArchivo = `verificacion_${req.usuario.id}_${Date.now()}.jpg`;
        const carpetaDestino = path.join(__dirname, '../uploads/verificaciones');
        
        if (!fs.existsSync(carpetaDestino)) {
            fs.mkdirSync(carpetaDestino, { recursive: true });
        }
        
        const rutaAbsoluta = path.join(carpetaDestino, nombreArchivo);
        fs.writeFileSync(rutaAbsoluta, bufferImagen);

        const rutaImagenLocal = `/uploads/verificaciones/${nombreArchivo}`;

        // 7. Actualizar el usuario en la BD
        req.usuario.verificado = true;
        req.usuario.foto_verificacion = rutaImagenLocal;
        await req.usuario.save();

        return res.json({
            exito: true,
            mensaje: 'Cuenta verificada correctamente',
            verificado: true,
            edadEstimada: resultadoIA.edad_estimada,
            fotoUrl: rutaImagenLocal
        });

    } catch (err) {
        console.error('Error en verificarCamara:', err.response?.data || err.message);
        
        const detalleError = err.response?.data?.detalle || err.response?.data?.error || err.message;
        return res.status(500).json({
            exito: false,
            message: `Error en la verificación: ${detalleError}`
        });
    }
};

module.exports = { 
    eliminarCuenta,
    obtenerPerfilPorId,
    verificarCamara,
};