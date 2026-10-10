const fs = require('fs');
const path = require('path');
const { SolicitudVerificacion } = require('../models');

const verificarEdadUsuario = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { imagen } = req.body;

    if (!imagen) {
      return res.status(400).json({ exito: false, message: 'No se recibió ninguna imagen.' });
    }

    // 1. Petición al microservicio de Python FastAPI
    const respuestaPython = await fetch('http://127.0.0.1:8000/api/usuarios/verificar-edad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen })
    });

    const resultadoPython = await respuestaPython.json();

    if (!respuestaPython.ok || !resultadoPython.exito) {
      return res.status(400).json({
        exito: false,
        message: resultadoPython.error || 'No se pudo verificar el rostro.'
      });
    }

    const edadEstimadaIA = resultadoPython.edad_estimada;
    const esMayorIA = resultadoPython.es_mayor_de_edad;

    // Helper para guardar foto de evidencia en servidor estático
    const guardarFotoEvidencia = () => {
      const dirEvidencias = path.join(__dirname, '../uploads/evidencias');
      if (!fs.existsSync(dirEvidencias)) {
        fs.mkdirSync(dirEvidencias, { recursive: true });
      }

      const fileName = `evidencia_user_${usuario.id}_${Date.now()}.jpg`;
      const filePath = path.join(dirEvidencias, fileName);
      const base64Data = imagen.replace(/^data:image\/\w+;base64,/, '');

      fs.writeFileSync(filePath, base64Data, 'base64');
      return `/uploads/evidencias/${fileName}`;
    };

    // 2. Calcular edad declarada SOLO SI existe fecha_nacimiento
    let edadDeclarada = null;
    let esMayorDeclarado = null;

    if (usuario.fecha_nacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(usuario.fecha_nacimiento);
      edadDeclarada = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edadDeclarada--;
      }
      esMayorDeclarado = edadDeclarada >= 18;
    }

    // ==================== FLUJO A: USUARIO SIN FECHA DE NACIMIENTO (Google Login) ====================
    if (esMayorDeclarado === null) {
      const rangoAsignado = esMayorIA ? 'mayor_18' : 'menor_18';
      
      await usuario.update({ 
        verificado: true, 
        rango_edad: rangoAsignado 
      });

      return res.json({
        exito: true,
        verificado: true,
        rango_edad: rangoAsignado,
        message: `Rostro verificado correctamente. Asignado al entorno de ${esMayorIA ? 'mayores' : 'menores'} de edad.`
      });
    }

    // ==================== FLUJO B: MATRIZ COMPLETA (Registro tradicional) ====================

    // CASO 1: Menor declarado + Menor detectado
    if (!esMayorDeclarado && !esMayorIA) {
      await usuario.update({ verificado: true, rango_edad: 'menor_18' });
      return res.json({
        exito: true,
        verificado: true,
        rango_edad: 'menor_18',
        message: '¡Verificación completada con éxito en el entorno protegido!'
      });
    }

    // CASO 2: Menor declarado + Adulto detectado (Bloqueo por sospecha de fraude)
    if (!esMayorDeclarado && esMayorIA) {
      const rutaEvidencia = guardarFotoEvidencia();

      await usuario.update({
        bloqueado: true,
        motivo_bloqueo: 'Discrepancia de edad: Menor declarado vs Adulto detectado por IA'
      });

      await SolicitudVerificacion.create({
        usuario_id: usuario.id,
        foto_evidencia: rutaEvidencia,
        edad_declarada: edadDeclarada,
        edad_estimada_ia: edadEstimadaIA,
        tipo_caso: 'BLOQUEO_POR_FRAUDE',
        estado: 'PENDIENTE'
      });

      return res.status(403).json({
        exito: false,
        message: 'Tu cuenta ha sido bloqueada preventivamente por inconsistencias en tu edad. Contacta a un administrador.'
      });
    }

    // CASO 3: Adulto declarado + Adulto detectado
    if (esMayorDeclarado && esMayorIA) {
      await usuario.update({ verificado: true, rango_edad: 'mayor_18' });
      return res.json({
        exito: true,
        verificado: true,
        rango_edad: 'mayor_18',
        message: '¡Rostro detectado y edad verificada con éxito!'
      });
    }

    // CASO 4: Adulto declarado + Menor detectado (Reasignación a menor + revisión)
    if (esMayorDeclarado && !esMayorIA) {
      const rutaEvidencia = guardarFotoEvidencia();

      await usuario.update({ verificado: true, rango_edad: 'menor_18' });

      await SolicitudVerificacion.create({
        usuario_id: usuario.id,
        foto_evidencia: rutaEvidencia,
        edad_declarada: edadDeclarada,
        edad_estimada_ia: edadEstimadaIA,
        tipo_caso: 'REVISION_MAYOR_A_MENOR',
        estado: 'PENDIENTE'
      });

      return res.json({
        exito: true,
        verificado: true,
        rango_edad: 'menor_18',
        message: 'La IA detectó rasgos de menor de edad. Tu perfil fue asignado al entorno protegido mientras un administrador revisa el caso.'
      });
    }

  } catch (error) {
    console.error('Error en el servicio de verificación de edad:', error.message);
    return res.status(500).json({
      exito: false,
      message: 'El servicio de verificación facial no está disponible en este momento.'
    });
  }
};

module.exports = { verificarEdadUsuario };