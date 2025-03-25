const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-custom-welcome-message")
    .setDescription("Set a custom welcome message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription(
          "The message to display when a new member joins the server. Use @user to mention the user."
        )
        .setRequired(false)
    ),
  async execute(interaction) {

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
      const logChannel = interaction.guild.channels.cache.find(
        (ch) => ch.id === config.logsChannel
      );

      if (!interaction.options.getString("message")) {
        config.welcomeMessage = null;
        await config.save();
        await interaction.reply({
          content: `✅ ${t(
            "Le message de bienvenue personnalisé a été désactivé."
          )}`,
          ephemeral: true,
        });
        const embed = new EmbedBuilder()
          .setTitle(`${t("Message d'accueil personnalisé")}`)
          .setDescription(
            `✅ ${t("Le message de bienvenue personnalisé a été désactivé.")}`
          )
          .setColor(colorTable.success);
        return await logChannel.send({ embeds: [embed], ephemeral: false });
      }

      const message = interaction.options.getString("message");
      config.welcomeMessage = message;
      await config.save();

      const embed = new EmbedBuilder()
        .setTitle(`${t("Message d'accueil personnalisé")}`)
        .setDescription(
          `✅ ${t("Le message de bienvenue personnalisé a été mis à jour.")}`
        )
        .addFields({ name: `${t("Nouveau message")}`, value: message })
        .setColor(0x00adef);
      await interaction.reply({
        content: `${t(
          "Le message de bienvenue personnalisé a été mis à jour."
        )}`,
        ephemeral: true,
      });
      await logChannel.send({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande links :", error);
      await interaction.reply({
        content: `${t(
          "Une erreur est survenue lors de la mise à jour du message d'accueil."
        )}`,
        ephemeral: true,
      });
    }
  },
};
