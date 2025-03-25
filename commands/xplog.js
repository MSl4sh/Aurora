const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../models/userSchema');
const useTranslate = require('../i18n');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-check')
        .setDescription("Display the XP and level of a user.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Target user.')
                .setRequired(true)),
    async execute(interaction, server) {
        const target = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const config = server.config;
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');

        const user = await User.findOne({ guildId, userId: target.id });
        if (!user) {
            return interaction.reply({
                content: `${t("Aucune donnée d'XP trouvée pour")} **${target.username}**.`,
                ephemeral: true,
            });
        }

        return interaction.reply({
            content: `**${target.username}**\nXP : ${user.xp}\n${t("Niveau")} : ${user.level}`,
            ephemeral: true,
        });
    },
};
