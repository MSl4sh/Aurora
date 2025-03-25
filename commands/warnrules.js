const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn-rules")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDescription(
      "Display the automatic sanction rules based on the number of warns."
    ),
  async execute(interaction, server) {

    try {

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
      // Récupérer la configuration du serveur
      const config = server.config;

      // Vérifier si des règles existent
      if (
        !config ||
        !config.warnSanctionLevels ||
        config.warnSanctionLevels.levels.length === 0
      ) {
        return interaction.reply({
          content: t(
            "❌ Aucune règle de sanctions automatiques n'a été définie sur ce serveur."
          ),
          ephemeral: true,
        });
      }

      // Construire l'embed
      const embed = new EmbedBuilder()
        .setTitle(t("⚠️ Règles de Sanctions Automatiques"))
        .setColor(colorTable.warning)
        .setDescription(
          t(
            "Voici les règles définies pour les sanctions automatiques basées sur les warns."
          )
        )
        .setTimestamp();

      // Ajouter chaque règle dans l'embed
      config.warnSanctionLevels.levels.forEach((rule, index) => {
        embed.addFields({
          name: `${t("Règle")} ${index + 1}`,
          value: `**${t("Nombre de warns")}** : ${rule.limit}\n**${t(
            "Action"
          )}** : ${rule.action}\n**Message** : ${
            rule.message || t("Pas de message personnalisé.")
          }${rule.roleId ? `\n**${t("Rôle")}** : <@&${rule.roleId}>` : ""}`,
        });
      });

      // Envoyer l'embed
      interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(
        "Erreur lors de l'affichage des règles de sanctions automatiques :",
        error
      );
      interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de l'affichage des règles."
        ),
        ephemeral: true,
      });
    }
  },
};
