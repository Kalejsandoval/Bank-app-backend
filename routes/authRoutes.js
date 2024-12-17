const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const admin = require('firebase-admin'); // Firebase Admin SDK
const User = require('../models/user');

const router = express.Router();

// Inicializa Firebase Admin SDK con el archivo de credenciales
admin.initializeApp({
    credential: admin.credential.cert(require('../config/firebase-admin.json')), // Ruta al archivo JSON
});

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token.split(' ')[1], JWT_SECRET); // Verificamos el token
        req.user = verified; // Guardamos los datos del usuario en req.user
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

// Ruta para registrar un usuario
router.post(
    '/register',
    [
        check('name', 'Name is required.').not().isEmpty(),
        check('email', 'A valid email is required.').isEmail(),
        check('password', 'Password must be at least 6 characters long.').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, email, password } = req.body;

            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already registered.' });
            }

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear un nuevo usuario
            const user = new User({ name, email, password: hashedPassword, balance: 0 });
            await user.save();

            // Generar un token JWT al registrar
            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

            res.status(201).json({
                message: 'User registered successfully.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    balance: user.balance,
                },
            });
        } catch (err) {
            res.status(500).json({ error: 'Server error', details: err.message });
        }
    }
);

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generar el token JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Ruta para login con Google
router.post('/google-login', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'idToken is required.' });
        }

        // Verifica el token de Firebase
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const email = decodedToken.email;
        const name = decodedToken.name || 'Google User'; // Extrae el nombre del usuario si está presente

        // Verifica si el usuario ya existe en la base de datos
        let user = await User.findOne({ email });
        if (!user) {
            // Si el usuario no existe, créalo
            user = new User({ email, name, balance: 0 }); // Guarda también el nombre del usuario
            await user.save();
        }

        // Genera un token JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name, // Enviar el nombre del usuario
                email: user.email,
                balance: user.balance,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


module.exports = router;
