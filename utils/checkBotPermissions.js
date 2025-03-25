const { PermissionFlagsBits } = require("discord.js");

/**
 * Vérifie si le bot a les permissions nécessaires pour voir et envoyer des messages et des embeds dans un canal donné.
 * @param {GuildChannel} channel - Le canal à vérifier.
 * @returns {boolean} - Retourne `true` si le bot a toutes les permissions nécessaires, sinon `false`.
 */
function hasChannelPermissions(channel) {
    if (!channel || !channel.guild || !channel.guild.members.me) {
        console.warn("Impossible de vérifier les permissions : le bot n'a pas accès au canal.");
        return false;
    }

    const botPermissions = channel.permissionsFor(channel.guild.members.me);
    if (!botPermissions) {
        console.warn(`Impossible de récupérer les permissions pour le canal : ${channel.name}`);
        return false;
    }

    const requiredPermissions = [
        PermissionFlagsBits.ViewChannel,  // Voir le canal
        PermissionFlagsBits.SendMessages, // Envoyer des messages
        PermissionFlagsBits.EmbedLinks    // Envoyer des embeds
    ];

    const missingPermissions = requiredPermissions.filter(perm => !botPermissions.has(perm));

    if (missingPermissions.length > 0) {
        console.warn(`Permissions manquantes dans #${channel.name}: ${missingPermissions.map(p => Object.keys(PermissionFlagsBits).find(k => PermissionFlagsBits[k] === p)).join(", ")}`);
        return false;
    }

    return true;
}

module.exports = hasChannelPermissions;
