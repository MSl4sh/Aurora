// commands/removeyoutube.js
const { PermissionFlagsBits } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-youtube")
    .setDescription("Delete all YouTube channels from the watchlist.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, server) {

    const config = server.config;
    
    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content:
            "❌ Configuration du serveur introuvable. Veuillez configurer le bot avant d'utiliser cette commande.",
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      if (!config.youtubeChannels) {
        return interaction.reply({
          content: t("❌ Aucune chaîne YouTube n'est actuellement surveillée."),
          ephemeral: true,
        });
      }
      config.youtubeChannels = [];
      await config.save();

      return interaction.reply({
        content: t(
          "✅ Les chaînes YouTube ont été supprimées de la liste de surveillance."
        ),
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de la suppression des chaînes YouTube."
        ),
        ephemeral: true,
      });
    }
  },
};
