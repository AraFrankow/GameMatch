const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

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
const { registrarChatSocket } = require('./sockets/chatSocket');
const integracionRoutes = require('./routes/integracionRoutes');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.set('io', io);
app.use(cors());
app.use(express.json());

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

registrarChatSocket(io);

app.get('/', (req, res) => res.json({ status: 'GameMatch API corriendo' }));
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexion a la base de datos OK');
    httpServer.listen(PORT, () => console.log(`🚀 Servidor + WebSocket corriendo en http://localhost:${PORT}`));
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
};

iniciar();
