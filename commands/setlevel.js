const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../models/userSchema');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlevel')
        .setDescription('Set the level of a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Target user')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level value')
                .setRequired(true)),
    async execute(interaction, server) {
        const target = interaction.options.getUser('user');
        const level = interaction.options.getInteger('level');
        const guildId = interaction.guild.id;
        const config = server.config;
        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');
        if (!config.xpSystem) {
            return interaction.reply({
                content: t("❌ Le système d'XP n'est pas activé."),
                ephemeral: true,
            });
        }
        try {
            let user = await User.findOne({ guildId, userId: target.id });
            if (!user) {
              user = new User({ guildId, userId: target.id, xp: 0, level: 1 });
            }
          
            user.level = level;
            user.xp = 1

            await user.save();
          
            const embed = new EmbedBuilder()
              .setTitle(t("Niveau défini"))
              .setDescription(t(`Le niveau de ${target.displayName} a été défini à ${level}.`))
              .setColor(colorTable.success)
              .setFooter({ text: `Commande exécutée par ${interaction.user.displayName}` })
              .setTimestamp();
          
            // Envoyer dans le canal des logs
            const logChannel = interaction.guild.channels.cache.get(config.logsChannel);
            if (logChannel) {
              await logChannel.send({ embeds: [embed] });
            }
          
            // Réponse unique à l'interaction
            return interaction.reply({
              content: `✅ ${t("le niveau de")} **${target.username}** ${t("a été défini à")} **${level}**.`,
              ephemeral: true,
            });
          } catch (error) {
            console.error(error);
            // Réponse en cas d'erreur (si aucune réponse n'a été envoyée)
            if (!interaction.replied) {
              return interaction.reply({
                content: `❌ Une erreur s'est produite.`,
                ephemeral: true,
              });
            }
          }
          
    },
};
