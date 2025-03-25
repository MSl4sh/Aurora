const mongoose = require("mongoose");

const autoModSchema = new mongoose.Schema({
    guildId: { type: String, required: true }, // Associer à un serveur
    enabled: { type: Boolean, default: false }, // Activation/désactivation

    // Règles d'auto-modération sous forme d'objet
    moderationRules: {
        blacklistWords: {
            enabled: { type: Boolean, default: false },
            list: { type: [String], default: [] }, // Liste des mots interdits
            action: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" }
        },
        blockLinks: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" }
        },
        capsSpam: {
            enabled: { type: Boolean, default: false },
            threshold: { type: Number, default: 5 }, // Nombre max de majuscules
            action: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" }
        },
        emojiSpam: {
            enabled: { type: Boolean, default: false },
            threshold: { type: Number, default: 5 }, // Nombre max d'émojis par message
            action: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" }
        },
        repeatSpam: {
            enabled: { type: Boolean, default: false },
            threshold: { type: Number, default: 3 }, // Nombre max de répétitions identiques
            action: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" }
        }
    },

    // Exemptions
    whitelistRoles: { type: [String], default: [] },
    whitelistChannels: { type: [String], default: [] },

    // Système de sanctions progressives
    sanctions: {
        warningsBeforeMute: { type: Number, default: 3 },
        warningsBeforeKick: { type: Number, default: 5 },
        warningsBeforeBan: { type: Number, default: 7 },
        muteDuration: { type: Number, default: 5 } // Durée du mute en minutes
    }
});

module.exports = mongoose.model("AutoModConfig", autoModSchema);