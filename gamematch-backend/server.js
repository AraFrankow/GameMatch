require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const jwt = require('jsonwebtoken');

require('./config/passportSteam');

const { sequelize, Usuario } = require('./models');
const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const bloqueoRoutes = require('./routes/bloqueoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const busquedaRoutes = require('./routes/busquedaRoutes');
const juegoRoutes = require('./routes/juegoRoutes');
const reputacionRoutes = require('./routes/reputacionRoutes');
const companeroRoutes = require('./routes/companeroRoutes');
const partidaRoutes = require('./routes/partidaRoutes');
const salaRoutes = require('./routes/salaRoutes');
const integracionRoutes = require('./routes/integracionRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const { registrarChatSocket } = require('./sockets/chatSocket');

const app = express();
const httpServer = http.createServer(app);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.get('/', (req, res) => res.status(200).json({ status: 'GameMatch API corriendo' }));
app.get('/health', (req, res) => res.status(200).send('OK'));

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:19006',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Error de autenticación: Token no proveído'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gamematch_jwt_secret');
    socket.usuario = decoded;
    next();
  } catch (err) {
    return next(new Error('Error de autenticación: Token inválido'));
  }
});

app.set('io', io);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gamematch_session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/bloqueos', bloqueoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/juegos', juegoRoutes);
app.use('/api/reputacion', reputacionRoutes);
app.use('/api/companeros', companeroRoutes);
app.use('/api/partidas', partidaRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/integraciones', integracionRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

registrarChatSocket(io);

const desconexionesPendientes = new Map();

io.on('connection', async (socket) => {
  const usuarioId = Number(
    socket.usuario?.id || 
    socket.usuario?.usuario?.id || 
    socket.usuario?.id_usuario
  );

  if (!usuarioId || isNaN(usuarioId)) return;

  if (desconexionesPendientes.has(usuarioId)) {
    clearTimeout(desconexionesPendientes.get(usuarioId));
    desconexionesPendientes.delete(usuarioId);
  }

  try {
    await Usuario.update({ estado: 'conectado' }, { where: { id: usuarioId } });
    io.emit('usuario_estado_cambiado', { usuario_id: usuarioId, estado: 'conectado' });
  } catch (err) {
    console.error(`Error al conectar usuario ${usuarioId}:`, err.message);
  }

  socket.on('cambiar_estado_manual', async ({ estado }) => {
    if (['conectado', 'ausente', 'desconectado'].includes(estado)) {
      try {
        await Usuario.update({ estado }, { where: { id: usuarioId } });
        io.emit('usuario_estado_cambiado', { usuario_id: usuarioId, estado });
      } catch (err) {
        console.error(`Error al cambiar estado manual:`, err.message);
      }
    }
  });

  socket.on('disconnect', () => {
    const timer = setTimeout(async () => {
      try {
        await Usuario.update({ estado: 'desconectado' }, { where: { id: usuarioId } });
        io.emit('usuario_estado_cambiado', { usuario_id: usuarioId, estado: 'desconectado' });
      } catch (err) {
        console.error(`Error al desconectar usuario ${usuarioId}:`, err.message);
      } finally {
        desconexionesPendientes.delete(usuarioId);
      }
    }, 5000);

    desconexionesPendientes.set(usuarioId, timer);
  });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP + WebSockets activo en el puerto ${PORT}`);
  
  sequelize.authenticate()
    .then(() => {
      console.log('Conexión con la base de datos Aiven establecida con éxito.');
    })
    .catch((err) => {
      console.error('Error de conexión con Aiven MySQL:', err.message);
    });
});