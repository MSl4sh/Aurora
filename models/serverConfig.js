const mongoose = require('mongoose');

const youtubeChannelSchema = new mongoose.Schema({
    rssUrl: { type: String, required: true },       // URL du flux RSS
    lastVideoId: { type: String, default: '' },     // Dernière vidéo détectée
    notifyChannelId: { type: String, required: true }, // ID du salon Discord pour notifier
    roleId: { type: String, default: null }, // ID du rôle attribué aux membres
  });
  
const birthdaySchema = new mongoose.Schema({ // Schéma pour les anniversaires
    userId: { type: String, required: true },       // ID de l'utilisateur
    birthday: { type: Date, required: true },      // Date de l'anniversaire
});

const linksSchema = new mongoose.Schema({ // Schéma pour les liens utiles
    name: { type: String, required: true }, // Nom du lien
    url: { type: String, required: true },  // URL du lien
});

const roleRewardSchema = new mongoose.Schema({ // Schéma pour les utilisateurs à ne pas mentionner
    roleId: { type: String, required: true },
    level: { type: Number, required: true },
});


const warnSanctionSchema = new mongoose.Schema({
    limit: { type: Number, required: true }, // Nombre de warns pour atteindre ce palier
    action: { 
      type: String, 
      required: true, 
      enum: ['warn', 'kick', 'ban', 'role-add', 'role-remove'], // Actions possibles
    },
    message: { type: String, default: 'Aucune description fournie.' }, // Message personnalisé pour la sanction
    roleId: { type: String, default: null }, // Optionnel, utilisé pour les actions de rôle
  });

// Schéma pour la configuration des serveurs
const configSchema = new mongoose.Schema({
    guild: { type:String, default:null}, // ID unique du serveur
    guildLanguage: { type: String, default: 'fr', required:true},       // Langue du serveur
    welcomeMessage: { type: String, default: null },
    moderationLogsChannel:{ type: String, default: null }, // Message de bienvenue
    links: [linksSchema],                                  // Liens utiles
    newMemberRole: { type: String, default: null },        // ID du rôle attribué aux nouveaux membres
    welcomeChannel: { type: String, default: null },        // ID du salon de bienvenue
    updatesChannel: { type: String, default: null },        // ID du salon des mises à jour
    logsChannel: { type: String, default: null },           // ID du salon des logs
    announcementsChannel: { type: String, default: null },  // ID du salon des annonces
    accountCheckEnabled: { type: Boolean, default: false }, // Activation de la vérification des comptes
    antiSpamEnabled: { type: Boolean, default: false },      // Activation de l'anti-spam
    reactionRoles:[
        {
            messageId: { type: String, required: true }, // ID du message
            emoji: { type: String, required: true },     // Emoji
            roleId: { type: String, required: true }     // ID du rôle
        }
    ],
    youtubeChannels: [youtubeChannelSchema], // Chaînes YouTube à surveiller
    xpSystem: { type: Boolean, default: false },
    levelRewards: [roleRewardSchema], // Activation du système d'XP
    birthdays: [birthdaySchema],              // Anniversaires des membres
    raidMode: { type: Boolean, default: false }, // Stocke l'état du mode Raid
    autoModConfig: {type: mongoose.Schema.Types.ObjectId, ref: "AutoModConfig" },
    warnSanctionLevels: {
        enabled: { type: Boolean, default: false }, // Activation des paliers de sanctions
        levels:[warnSanctionSchema] // Paliers de sanctions
    }, 
    
});

module.exports = mongoose.model('ServerConfig', configSchema);
