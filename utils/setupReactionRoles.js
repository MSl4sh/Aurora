const Server = require('../models/serverSchema');

async function setupReactionRoles(client) {
    try {
        // Récupérer tous les serveurs
        const servers = await Server.find({}).populate('config');
        
        for (const server of servers) {
            const guild = client.guilds.cache.get(server.guildId);
            if (!guild) continue;

            const config = server.config;
            if (!config.reactionRoles || config.reactionRoles.length === 0) continue;

            // Pour chaque configuration de reaction role
            for (const reactionRole of config.reactionRoles) {
                try {
                    // Trouver le message
                    const channel = await guild.channels.fetch(reactionRole.channelId);
                    if (!channel) continue;

                    const message = await channel.messages.fetch(reactionRole.messageId);
                    if (!message) continue;

                    // Vérifier si la réaction existe déjà
                    const hasReaction = message.reactions.cache.has(reactionRole.emoji);
                    if (!hasReaction) {
                        // Ajouter la réaction si elle n'existe pas
                        await message.react(reactionRole.emoji);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la configuration du reaction role pour le message ${reactionRole.messageId}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la configuration des reaction roles:', error);
    }
}

module.exports = setupReactionRoles; 