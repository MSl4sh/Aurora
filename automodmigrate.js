const mongoose = require("mongoose");
require('dotenv').config();
const ServerConfig = require("./models/serverConfig");
const AutoModConfig = require("./models/autoModSchema");

const MONGO_URI = process.env.MONGODB_URI; // Remplace par ton URI MongoDB

async function migrateAutoMod() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Connexion MongoDB établie");

        // Supprimer toutes les anciennes configurations AutoMod
        await AutoModConfig.deleteMany({});
        console.log("🗑️ Toutes les anciennes configurations AutoMod ont été supprimées.");

        // Récupérer toutes les configurations de serveur
        const serverConfigs = await ServerConfig.find();
        console.log(`🔍 ${serverConfigs.length} configurations de serveur trouvées.`);

        for (const server of serverConfigs) {
            // Vérifier si une nouvelle configuration AutoMod existe déjà
            let autoModConfig = await AutoModConfig.findOne({ guildId: server.guild });

            if (!autoModConfig) {
                autoModConfig = new AutoModConfig({
                    guildId: server.guild,
                    enabled: false, // Désactivé par défaut
                    moderationRules: {
                        blacklistWords: { enabled: false, list: [], action: "warn" },
                        blockLinks: { enabled: false, action: "warn" },
                        capsSpam: { enabled: false, threshold: 5, action: "warn" },
                        emojiSpam: { enabled: false, threshold: 5, action: "warn" },
                        repeatSpam: { enabled: false, threshold: 3, action: "warn" },
                    },
                    whitelistRoles: [],
                    whitelistChannels: [],
                    sanctions: {
                        warningsBeforeMute: 3,
                        warningsBeforeKick: 5,
                        warningsBeforeBan: 7,
                        muteDuration: 5,
                    },
                });

                await autoModConfig.save();
                console.log(`🚀 Nouvelle configuration AutoMod créée pour le serveur ${server.guild}`);
            }

            // Associer la configuration AutoMod au ServerConfig
            server.autoModConfig = autoModConfig._id;
            await server.save();
            console.log(`🔗 Configuration AutoMod liée au serveur ${server.guild}`);
        }

        console.log("🎉 Migration terminée !");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Erreur lors de la migration :", error);
        mongoose.connection.close();
    }
}

// Lancer la migration
migrateAutoMod();
