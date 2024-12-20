const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Configuración de variables de entorno
dotenv.config();

// Inicializar aplicación
const app = express();

// Configuración avanzada de CORS
const allowedOrigins = [
    'http://localhost:3000', // Desarrollo local
    'https://frontend-qy78.onrender.com', // Frontend en Render
    'https://sandovalfullstackbankingapplication.lat', // Dominio principal
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir solicitudes desde orígenes permitidos o sin origen (por ejemplo, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
    credentials: true // Permitir cookies o credenciales
}));

// Middlewares
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log('MongoDB conectado exitosamente'))
.catch(err => console.error('Error al conectar MongoDB:', err));

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

// Manejo de errores CORS
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message === 'No permitido por CORS') {
        return res.status(403).json({ message: 'Origen no permitido por CORS' });
    }
    next(err);
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));



