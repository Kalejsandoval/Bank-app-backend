const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importamos JWT
const { check, validationResult } = require('express-validator');
const User = require('../models/user');

const router = express.Router();

// **Clave secreta para JWT**
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// **Middleware para verificar el token**
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

// **Rutas protegidas: Depósito, Retiro y Balance**
// **Rutas protegidas: Depósito, Retiro y Balance**
router.post('/deposit', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid deposit amount.' });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Asegúrate de que el array `transactions` exista
        if (!user.transactions) {
            user.transactions = [];
        }

        // Agrega la transacción
        user.transactions.push({
            type: 'deposit',
            amount,
            date: new Date(),
        });

        user.balance += amount;
        await user.save();

        res.status(200).json({
            message: 'Deposit successful.',
            balance: user.balance,
            transactions: user.transactions, // Devuelve las transacciones
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.post('/withdraw', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid withdrawal amount.' });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }

        // Asegúrate de que el array `transactions` exista
        if (!user.transactions) {
            user.transactions = [];
        }

        // Agrega la transacción
        user.transactions.push({
            type: 'withdraw',
            amount,
            date: new Date(),
        });

        user.balance -= amount;
        await user.save();

        res.status(200).json({
            message: 'Withdrawal successful.',
            balance: user.balance,
            transactions: user.transactions, // Devuelve las transacciones
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});



router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Balance retrieved successfully.',
            balance: user.balance,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Ruta para verificar si el token es válido
router.get('/verify-token', authenticateToken, (req, res) => {
    try {
        res.status(200).json({
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Exportar el router
module.exports = router;
