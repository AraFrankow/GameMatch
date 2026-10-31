require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');

require('./config/passportSteam');

const { sequelize } = require('./models');
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

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

app.use(cors({
  origin: CLIENT_URL,
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

app.get('/', (req, res) => res.json({ status: 'GameMatch API corriendo' }));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error('Error no capturado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Conexión a la base de datos OK');
    httpServer.listen(PORT, () => console.log(`🚀 Servidor + WebSocket corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
};

iniciar();