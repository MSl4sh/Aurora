const { Events, PermissionsBitField,EmbedBuilder } = require('discord.js');
const ServerConfig = require('../models/serverConfig');

const spamData = new Map(); // Remplacement de WeakMap par Map

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return; // Ignorer les bots et DM

        const { guild, author } = message;

        // Charger la configuration du serveur
        const serverConfig = await ServerConfig.findOne({ guild: guild.id });
        if (!serverConfig || !serverConfig.antiSpamEnabled) return; // Vérifier si l'anti-spam est activé

        const now = Date.now();

        // Initialiser les données du serveur si elles n'existent pas
        if (!spamData.has(guild.id)) {
            spamData.set(guild.id, new Map());
        }

        const serverSpam = spamData.get(guild.id);

        // Initialiser les données de l'utilisateur si elles n'existent pas
        if (!serverSpam.has(author.id)) {
            serverSpam.set(author.id, { messages: [], warnings: 0, timeout: null });
        }

        const userData = serverSpam.get(author.id);
        userData.messages.push(now);

        // FIFO : garder seulement les 10 derniers messages
        if (userData.messages.length > 10) {
            userData.messages.shift();
        }

        // Supprimer les messages trop vieux (plus de 3 secondes)
        userData.messages = userData.messages.filter(timestamp => now - timestamp < 3000);

        // Vérification du spam (5 messages en 3 secondes)
        if (userData.messages.length >= 5) {
            userData.warnings++;

            if (userData.warnings < 3) {
                message.channel.send(`${author}, ⚠️ Attention au spam ! Avertissement ${userData.warnings}/3.`);
                const logsChannel = guild.channels.cache.get(serverConfig.moderationLogsChannel);
                if (logsChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('**Auto-mod**:⚠️ Avertissement Spam')
                        .setColor('#FFA500')
                        .setDescription(`${author}, a reçu un avertissement automatique pour spam.`)
                        .setTimestamp();
                    logsChannel.send({ embeds: [embed] });
                }
            } else {
                try {
                    // Vérifier si l'utilisateur n'est pas déjà en slowmode
                    const permissionOverwrites = message.channel.permissionOverwrites.cache.get(author.id);
                    if (!permissionOverwrites || !permissionOverwrites.deny.has(PermissionsBitField.Flags.SendMessages)) {
                        await message.channel.permissionOverwrites.edit(author.id, {
                            SendMessages: false
                        });
                        const embed = new EmbedBuilder()
                            .setTitle('🔇 Mute')
                            .setColor('#FF0000')
                            .setDescription(`${author}, a été **muté** par le système anti-spam.`)
                            .setTimestamp();

                            const logsChannel = guild.channels.cache.get(serverConfig.moderationLogsChannel);
                            if (logsChannel) {
                                logsChannel.send({ embeds: [embed] });
                            }

                        setTimeout(() => {
                            message.channel.permissionOverwrites.delete(author.id);
                        }, 300000); // 5 minutes = 300000 ms

                        message.channel.send(`${author}, vous avez été **muté pendant 5 minutes** pour spam.`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'application du slowmode :`, error);
                }

                // Réinitialiser après sanction
                serverSpam.delete(author.id);
            }
        }

        // Nettoyage automatique après 10 minutes d'inactivité
        if (userData.timeout) clearTimeout(userData.timeout);
        userData.timeout = setTimeout(() => {
            serverSpam.delete(author.id);
            if (serverSpam.size === 0) {
                spamData.delete(guild.id);
            }
        }, 600000); // 10 minutes
    }
};
