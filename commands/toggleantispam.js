const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggle-antispam")
    .setDescription("Enable or disable the anti-spam system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, server) {

    try {
      const config = server.config;
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: "❌ La configuration du serveur est introuvable.",
          ephemeral: true,
        });
      }

      useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ManageMessages
        )
      ) {
        return interaction.reply({
          content: t(
            "❌ Je n'ai pas la permission de gérer les messages. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }

      if (!config) {
        return interaction.reply({
          content: t(
            "❌ Impossible de trouver la configuration du serveur dans la base de données."
          ),
          ephemeral: true,
        });
      }

      // Inverser l'état actuel
      config.antiSpamEnabled = !config.antiSpamEnabled;
      await config.save();

      // Réponse à l'utilisateur
      const embed = new EmbedBuilder()
        .setColor(config.antiSpamEnabled ? colorTable.success : colorTable.danger)
        .setTitle("Anti-Spam")
        .setDescription(
          config.antiSpamEnabled
            ? t("✅ Le système de détection des spams est maintenant activé.")
            : t(
                "❌ Le système de détection des spams est maintenant désactivé."
              )
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Erreur lors de l’exécution de /toggleantispam :", error);
      await interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors du traitement de la commande."
        ),
        ephemeral: true,
      });
    }
  },
};
