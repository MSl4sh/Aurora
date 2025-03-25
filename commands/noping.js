const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const colorTable = require("../utils/colorTable");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("no-ping")
    .setDescription(
      "Display a GIF to show how to disable pings and mentions."
    ),
  async execute(interaction, server) {
    try {


      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      const gifURL =
        "https://cdn.discordapp.com/attachments/777611647014666249/1308922821619220603/desactive_le_ping.gif?ex=6763f61f&is=6762a49f&hm=286e420ce0443674b753b3d9666e5291620b60c9a8a9d2893c6af20629c7218f&";

      // Crée un embed avec le GIF
      const embed = new EmbedBuilder()
        .setTitle(`${t("Désactiver les pings et mentions")}`)
        .setImage(gifURL)
        .setColor(colorTable.info); // Bleu pour un aspect informatif

      // Envoie l'embed
      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la commande noping :",
        error
      );
      await interaction.reply({
        content: `❌ ${t(" Une erreur est survenue lors de l'envoi du GIF.")}`,
        ephemeral: true,
      });
    }
  },
};
