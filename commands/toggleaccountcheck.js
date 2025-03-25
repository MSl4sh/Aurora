const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggle-account-check")
    .setDescription("Enable or disable the account check for new members.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, server) {
    const guild = interaction.guild;
    const config = server.config;

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ La configuration du serveur est introuvable.`,
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      // Inverser l'état actuel
      config.accountCheckEnabled = !config.accountCheckEnabled;
      await config.save();

      // Répondre à l'utilisateur
      const embed = new EmbedBuilder()
        .setColor(config.accountCheckEnabled ? colorTable.success : colorTable.danger)
        .setTitle(
          config.accountCheckEnabled
            ? t("Vérification Activée")
            : t("Vérification Désactivée")
        )
        .setDescription(
          config.accountCheckEnabled
            ? t("La vérification des comptes récents est désormais activée.")
            : t("La vérification des comptes récents est désormais désactivée.")
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Erreur lors de la commande toggleaccountcheck :", error);
      await interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors du traitement de la commande."
        ),
        ephemeral: true,
      });
    }
  },
};
