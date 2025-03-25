const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const isBot = require("../utils/isBot");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Display the warnings of a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to display the warnings.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const user = interaction.options.getUser("user");
    // Cherche si le serveur existe déjà dans la base
  

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: "❌ Aucune donnée trouvée pour ce serveur.",
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

      if (isBot(user)) {
        return interaction.reply({
          content: t(
            "❌ Vous ne pouvez pas utiliser cette commande sur un bot."
          ),
          ephemeral: true,
        });
      }

      let userWarnings = server.warnings.find((w) => w.userId === user.id);

      if (!userWarnings) {
        return interaction.reply({
          content: `✅ ${user.tag} ${t("n'a aucun avertissement.")}`,
          ephemeral: true,
        });
      }

      const warningList = userWarnings.warns
        .map(
          (warn, index) =>
            `**#${index + 1}** - **${t("Raison")}**: ${
              warn.reason
            }\n**Date**: ${new Date(warn.date).toLocaleString()}\n**${t(
              "Modérateur"
            )}**: ${warn.moderator}\n**ID**: ${warn.case_id}`
        )
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(colorTable.warning)
        .setTitle(`${t("Avertissements pour")} ${user.tag}`)
        .setDescription(warningList)
        .setTimestamp();

      interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(
        "❌ Une erreur est survenue lors de l'affichage des avertissements",
        error
      );
      interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de l'affichage des avertissements."
        ),
        ephemeral: true,
      });
    }
  },
};
