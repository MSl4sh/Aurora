const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("Delete a warning from a user by its ID.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addStringOption((option) =>
      option
        .setName("case_id")
        .setDescription("The ID of the warning to delete.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const guild = interaction.guild;
    const caseId = interaction.options.getString("case_id");
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
          content: t(
            "❌ Je n'ai pas la permission nécessaire pour éxecuter cette commande. Veuillez vérifier mes permissions **Moderate Members**."
          ),
          ephemeral: true,
        });
      }
      // Récupérer le serveur

      // Rechercher et supprimer le warning
      let warningDeleted = false;
      for (const userWarnings of server.warnings) {
        const index = userWarnings.warns.findIndex(
          (warn) => warn.case_id === caseId
        );

        if (index !== -1) {
          userWarnings.warns.splice(index, 1); // Supprime le warning
          warningDeleted = true;

          // Si l'utilisateur n'a plus de warns, supprimer l'entrée entière
          if (userWarnings.warns.length === 0) {
            server.warnings = server.warnings.filter(
              (w) => w.userId !== userWarnings.userId
            );
          }
          break;
        }
      }

      if (!warningDeleted) {
        return interaction.reply({
          content: `❌ ${t(
            "Aucun avertissement trouvé avec l'ID"
          )} **${caseId}**.`,
          ephemeral: true,
        });
      }

      // Sauvegarder les modifications
      await server.save();

      // Répondre à l'utilisateur
      interaction.reply({
        content: `✅ ${t("L'avertissement avec l'ID")} **${caseId}** ${t(
          "a été supprimé avec succès."
        )}`,
        ephemeral: true,
      });

      // Envoyer un log dans le salon de logs si configuré
      const logsChannel = guild.channels.cache.get(config.moderationLogsChannel);
      if (logsChannel) {
        const embed = new EmbedBuilder()
          .setColor(colorTable.warning)
          .setTitle(t("Avertissement supprimé"))
          .addFields(
            { name: t("ID du cas"), value: caseId, inline: true },
            {
              name: t("Modérateur"),
              value: `${interaction.member.displayName}`,
              inline: true,
            }
          )
          .setTimestamp();

        logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(
        "❌ Une erreur est survenue lors de la suppression d'un avertissement :",
        error
      );
      interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de la suppression de l'avertissement."
        ),
        ephemeral: true,
      });
    }
  },
};
