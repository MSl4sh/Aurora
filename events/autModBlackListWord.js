const { Events, EmbedBuilder } = require("discord.js");
const AutoModConfig = require("../models/autoModSchema");
const { execute } = require("./autoMod/autoModHandler");


const infractions = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const { guild, member } = message;
        const autoModConfig = await AutoModConfig.findOne({ guildId: guild.id });
        
        const whitelistChannels = autoModConfig.whitelistChannels || [];
        const whitelistRoles = autoModConfig.whitelistRoles || [];

        if (whitelistChannels.includes(message.channel.id) || member.roles.cache.some(r => whitelistRoles.includes(r.id))) return;

        if (!autoModConfig || !autoModConfig.enabled) return;

        const userKey = `${guild.id}-${member.id}`;

        if (!infractions.has(userKey)) {
            infractions.set(userKey, { count: 0, timestamp: Date.now() });
        }

        let userInfractions = infractions.get(userKey);

        // Exécuter toutes les règles activées
        const violations = await execute(message, autoModConfig);

        if (violations.length === 0) return;

        userInfractions.count++;

        // Envoi du message d'avertissement
        message.channel.send(`${member}, ⚠️ **Attention !** Vous avez enfreint les règles : ${violations.map(v => v.rule).join(", ")}. (Infractions: ${userInfractions.count})`);

        // Application des sanctions progressives
        if (userInfractions.count >= autoModConfig.sanctions.warningsBeforeBan) {
            member.ban({ reason: "Spam / AutoMod" }).catch(() => {});
            sendLog(guild, member, "⛔ Bannissement", violations);
            infractions.delete(userKey);
        } else if (userInfractions.count >= autoModConfig.sanctions.warningsBeforeKick) {
            member.kick("Spam / AutoMod").catch(() => {});
            sendLog(guild, member, "⚠️ Expulsion", violations);
            infractions.delete(userKey);
        } else if (userInfractions.count >= autoModConfig.sanctions.warningsBeforeMute) {
            await member.timeout(autoModConfig.sanctions.muteDuration * 60 * 1000).catch(() => {});
            sendLog(guild, member, "🔇 Mute temporaire", violations);
        }

        setTimeout(() => infractions.delete(userKey), autoModConfig.detectionWindow * 1000);
    }
};

// Fonction pour envoyer les logs sous forme d'Embed
function sendLog(guild, member, action, violations) {
    const logChannelId = guild.config.moderationLogsChannel;
    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("🔍 **Auto-Mod** - Infraction")
        .setColor("Red")
        .setDescription(`**Utilisateur:** ${member}\n**Action appliquée:** ${action}\n**Règles enfreintes:** ${violations.map(v => v.rule).join(", ")}`)
        .setTimestamp();

    logChannel.send({ embeds: [embed] });
}
