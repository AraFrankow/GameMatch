# 🎮 GameMatch — Plataforma de Matchmaking & Comunidad Gamer

GameMatch es una plataforma web de matchmaking y comunicación en tiempo real diseñada para conectar jugadores según compatibilidad de videojuegos, modo de juego, reputación y franjas de edad. La aplicación incorpora una arquitectura desacoplada y un entorno seguro con aislamiento estricto de protección para usuarios menores de edad.

---

## 🛠️ Tecnologías y Stack

### Frontend (`gamematch-frontend`)
- **Framework:** React.js + Vite
- **Estilos:** Tailwind CSS
- **Comunicación en Tiempo Real:** Socket.io-client
- **Cliente HTTP:** Axios

### Backend Principal (`gamematch-backend`)
- **Entorno de Ejecución:** Node.js + Express.js
- **ORM & Base de Datos:** Sequelize ORM / MySQL 8.0
- **Autenticación & Seguridad:** JWT (JSON Web Tokens) & Bcrypt
- **WebSockets:** Socket.io
- **Pasarela de Pagos:** Stripe API

### Microservicio de IA (En Desarrollo / Opcional)
- **Framework:** Python + FastAPI
- **Visión por Computadora & IA:** OpenCV + DeepFace
- **Procesamiento Biométrico:** Inferencia en memoria RAM (sin persistencia de imágenes en disco)

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes componentes en tu sistema:

- [Node.js](https://nodejs.org/) (v18.0.0 o superior)
- [npm](https://www.npmjs.com/) (v9.0.0 o superior)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) (v8.0 o superior, o MySQL vía XAMPP / Workbench)
- [Git](https://git-scm.com/)

---

## 🚀 Guía de Instalación y Configuración Local

### 1. Clonar el Repositorio
```bash
git clone [https://github.com/tu-usuario/gamematch.git](https://github.com/tu-usuario/gamematch.git)
cd gamematch
```

---

### 2. Configurar la Base de Datos (MySQL)
Crea una base de datos vacía en MySQL utilizando tu cliente de preferencia (MySQL Workbench, phpMyAdmin, DBeaver o CLI):

```sql
CREATE DATABASE gamematch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
> *Nota: Las tablas e índices relacionales se sincronizan automáticamente al iniciar el servidor de Node.js mediante Sequelize ORM.*

---

### 3. Configurar las Variables de Entorno

1. Navega a la carpeta del servidor backend (`gamematch-backend`).
2. Copia la plantilla `.env.example` para crear tu archivo `.env` local:

```bash
cd gamematch-backend
cp .env.example .env
```

3. Abre el archivo `.env` y completa tus credenciales locales de MySQL y la clave secreta de JWT:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql_aqui
DB_NAME=gamematch_db

JWT_SECRET=escribe_aqui_una_clave_secreta_jwt_de_desarrollo

CLIENT_URL=http://localhost:5173
PYTHON_SERVICE_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
```

---

### 4. Instalación y Ejecución del Backend (Node.js)

Desde la carpeta `gamematch-backend/`:

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo
npm run dev
```

El servidor backend quedará disponible en: `http://localhost:3000`

---

### 5. Instalación y Ejecución del Frontend (React + Vite)

Abre una nueva terminal y dirígete a la carpeta `gamematch-frontend/`:

```bash
cd gamematch-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo de Vite
npm run dev
```

La aplicación web estará disponible en: `http://localhost:5173`

---

## 📁 Estructura del Proyecto

```text
gamematch/
├── gamematch-frontend/       # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables de UI (Modales, Cards, Chat)
│   │   ├── pages/            # Páginas principales (Dashboard, Perfil, Matchmaking)
│   │   ├── services/         # Cliente HTTP (Axios) y WebSockets (Socket.io)
│   │   └── App.jsx
│   └── package.json
│
├── gamematch-backend/        # Backend Principal (Node.js + Express)
│   ├── config/               # Configuración y conexión de base de datos (Sequelize)
│   ├── controllers/          # Lógica de controladores (Usuarios, Salas, Chat, Stripe)
│   ├── middleware/           # Middlewares de Autenticación JWT y Aislamiento de Menores
│   ├── models/               # Modelos relacionales de Sequelize (User, Room, Message, etc.)
│   ├── routes/               # Definición de rutas de la API REST
│   ├── sockets/              # Controladores de eventos de WebSockets
│   ├── .env.example          # Plantilla pública de variables de entorno
│   ├── server.js             # Punto de entrada de la aplicación
│   └── package.json
│
├── .gitignore                # Archivos excluidos del control de versiones (.env, node_modules)
└── README.md                 # Documentación del proyecto
```

---

## 🔒 Reglas de Negocio y Seguridad

- **Seguridad y Aislamiento de Menores:** Entorno protegido donde los usuarios menores de edad interactúan exclusivamente entre sí en búsquedas, salas grupales y chats 1 a 1.
- **Protección de Datos Biométricos:** La verificación de edad por IA procesa fotogramas en un buffer de memoria RAM descartable, sin almacenar imágenes en disco ni en base de datos.
- **Gestión de Credenciales:** Todas las claves sensibles y secretos JWT están excluidos del repositorio mediante `.gitignore` y se configuran localmente en archivos `.env`.

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos y de demostración.
