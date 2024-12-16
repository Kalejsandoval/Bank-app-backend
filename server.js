const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');



// Configuración de variables de entorno
dotenv.config();

// Inicializar aplicación
const app = express();

// Middlewares


// Configuración de CORS


// Permite solicitudes de localhost:3000
app.use(cors({
    origin: ['http://localhost:3000', 'https://tu-frontend-desplegado.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use(express.json());

// Conexión a MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado exitosamente'))
    .catch((err) => console.error('Error al conectar MongoDB:', err));

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);


// Ruta raíz
app.get('/', (req, res) => {
    res.send('Servidor corriendo correctamente');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

