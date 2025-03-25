const { EmbedBuilder } = require('discord.js');
const Server = require('../models/serverSchema'); // Modèle adapté à votre structure.
const colorTable = require('../utils/colorTable');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const guild = oldState.guild
        const server = await Server.findOne({ guildId: guild.id }).populate('config');
        try {

            // Récupérer la configuration du serveur
            const serverConfig = server.config;

            if (!server.config || !serverConfig.logsChannel) {
                console.log(`Aucun canal de logs configuré pour le serveur ${guild.name}.`);
                return;
            }

            const logChannel = guild.channels.cache.get(serverConfig.logsChannel);
            if (!logChannel) {
                console.log(`Le canal de logs configuré pour le serveur ${guild.name} est introuvable.`);
                return;
            }

            const member = oldState.member || newState.member;

            // Vérifiez si l'utilisateur rejoint un canal vocal
            if (!oldState.channel && newState.channel) {
                const embed = new EmbedBuilder()
                    .setColor(colorTable.success) // Vert pour rejoindre
                    .setAuthor({
                        name: member.user.displayName,
                        iconURL: member.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setDescription(`**<@${member.id}> a rejoint un canal vocal** ${newState.channel}`)
                    .setFooter({ text: `ID du canal vocal: ${newState.channel.id}` })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            // Vérifiez si l'utilisateur quitte un canal vocal
            else if (oldState.channel && !newState.channel) {
                const embed = new EmbedBuilder()
                    .setColor(colorTable.danger) // Rouge pour quitter
                    .setAuthor({
                        name: member.user.displayName,
                        iconURL: member.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setDescription(`**<@${member.id}> a quitté un canal vocal**${oldState.channel}`)
                    .setFooter({ text: `ID du canal vocal: ${oldState.channel.id}` })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Erreur lors de l’exécution de voiceStateUpdate:', error);
        }
    },
};
