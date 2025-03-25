const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("links")
    .setDescription("display useful links for the server."),
  async execute(interaction, server) {
    const config = server.config;

    try {
      
      const useTranslate = require("../i18n");
      const { t } = useTranslate(config.guildLanguage);

      if (!config.links || config.links.length === 0) {
        return interaction.reply({
          content: `❌ ${t("Aucun lien configuré pour ce serveur.")}`,
          ephemeral: true,
        });
      }

      const fields = config.links.map((link) => ({
        name: link.name || `${t("Lien")}`,
        value: link.url,
        inline: false,
      }));

      const embed = new EmbedBuilder()
        .setTitle(`🔗${t("Liens utiles")}`)
        .setColor(colorTable.info) 
        .addFields(fields);
      // Envoie l'embed
      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande links :", error);
      await interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de la récupération des liens"
        )}`,
        ephemeral: true,
      });
    }
  },
};
