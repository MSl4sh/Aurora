const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    guildId: { type: String, required: true }, // Référence au serveur
    userId: { type: String, required: true }, // ID unique de l'utilisateur
    xp: { type: Number, default: 0 }, // XP de l'utilisateur
    level: { type: Number, default: 1 }, // Niveau de l'utilisateur
    dontPing: { type: Boolean, default: false }, // Protection contre les pings
});

module.exports = mongoose.model('User', userSchema);