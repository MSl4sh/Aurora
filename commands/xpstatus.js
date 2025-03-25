const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-status')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDescription('Display the status of the XP system.'),
    async execute(interaction, server) {

        const config = server.config;
        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');

        if (!config || !config.xpSystem) {
            return interaction.reply({
                content: t("❌ Le système d'XP n'est pas activé."),
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(t("Configuration du système d'XP"))
            .setDescription(t("Le système d'XP est activé."))
            .setColor(colorTable.success)
            .setFooter({ text: `${("Demandé par")} ${interaction.user.displayName}` })
            .setTimestamp();
        
        if (config.levelRewards.length > 0) {
            const rewards = config.levelRewards.map(r => `${("Niveau")} ${r.level} : ${interaction.guild.roles.cache.get(r.roleId)}`).join('\n');
            embed.addFields([
                { name: t("Récompenses de niveau"), value: rewards }
            ]);
        }

        return interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    },
};
