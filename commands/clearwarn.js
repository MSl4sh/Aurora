const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const colorTable = require("../utils/colorTable")
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear-warn")
    .setDescription("Delete all warnings of a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "The user to delete all warnings from."
        )
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const guild = interaction.guild;
    const user = interaction.options.getUser("user");
    const config = server.config;
    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ Aucune donnée trouvée pour ce serveur.`,
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: `❌ ${t("Je n'ai pas la permission de gérer les membres.")}`,
          ephemeral: true,
        });
      }
      // Récupérer les données du serveur

      // Rechercher les avertissements de l'utilisateur
      const userWarningsIndex = server.warnings.findIndex(
        (warning) => warning.userId === user.id
      );

      if (userWarningsIndex === -1) {
        return interaction.reply({
          content: `❌ ${t("Cet utilisateur n'a pas d'avertissements.")}`,
          ephemeral: true,
        });
      }

      // Supprimer tous les avertissements de l'utilisateur
      server.warnings.splice(userWarningsIndex, 1);
      await server.save();

      // Répondre à l'utilisateur
      interaction.reply({
        content: `✅ ${t("Tous les avertissements de")} **<@${
          user.displayName
        }>** ${t("ont été supprimés.")}`,
        ephemeral: true,
      });

      // Log dans le salon des logs si configuré
      const logsChannel = guild.channels.cache.get(config.moderationLogsChannel);
      if (!hasChannelPermissions(logsChannel)) {
        return interaction.reply({
            content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}',logsChannel),
            ephemeral: true
        });
    }
      if (logsChannel) {
        const embed = new EmbedBuilder()
          .setColor(colorTable.success)
          .setTitle(`🚫 ${t("Avertissements supprimés")}`)
          .addFields(
            {
              name: `${t("Membre")}`,
              value: `<@${user.displayName}> (${user.id})`,
              inline: true,
            },
            {
              name: `${t("Modérateur")}`,
              value: `${interaction.user.displayName}`,
              inline: true,
            },
            {
              name: `${t("Action")}`,
              value: `${t("Suppression des avertissements")}`,
              inline: false,
            }
          )
          .setTimestamp();
        logsChannel.send({
          embeds: [embed],
        });
      }
    } catch (error) {
      console.error(
        "❌ Une erreur est survenue lors de la suppression des avertissements :",
        error
      );
      interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de la suppression des avertissements."
        )}`,
        ephemeral: true,
      });
    }
  },
};
