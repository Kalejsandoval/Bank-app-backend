const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    transactions: [
        {
            type: { type: String, required: true }, // "deposit" o "withdraw"
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model('User', userSchema);
