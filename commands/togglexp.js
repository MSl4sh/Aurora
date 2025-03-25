const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../models/userSchema');
const useTranslate = require('../i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription("Enable or disable the XP system.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable the system.')
                .addBooleanOption(option =>
                    option.setName('activate')
                        .setDescription('Activate or deactivate the system.')
                        .setRequired(true))),
    async execute(interaction, server) {
        const activate = interaction.options.getBoolean('activate');
        const guildId = interaction.guild.id;
        const config = server.config;
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : "");

        if (activate) {
            // Activer le système d'XP
            if (config.xpSystem) {
                return interaction.reply({ content: t("Le système d'XP est déjà activé."), ephemeral: true });
            }
            config.xpSystem = true;
            await config.save();
            return interaction.reply({ content: t("Le système d'XP a été activé avec succès."), ephemeral: true });
        } else {
            // Désactiver le système d'XP
            if (!config.xpSystem) {
                return interaction.reply({ content: t("Le système d'XP est déjà désactivé."), ephemeral: true });
            }

            // Supprimer toutes les données associées
            await User.deleteMany({ guildId });
            config.xpSystem = false;
            await config.save();
            return interaction.reply({ content: t("Le système d'XP a été désactivé et toutes les données ont été supprimées."), ephemeral: true });
        }
    },
};
