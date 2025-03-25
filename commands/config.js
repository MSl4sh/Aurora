const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure les paramètres du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Sous-commande pour les salons
    .addSubcommand(subcommand =>
      subcommand
        .setName("channels")
        .setDescription("Configure les salons du serveur")
        .addChannelOption(option =>
          option
            .setName("welcome")
            .setDescription("Le salon de bienvenue")
            .setRequired(false))
        .addChannelOption(option =>
          option
            .setName("logs")
            .setDescription("Le salon des logs")
            .setRequired(false))
        .addChannelOption(option =>
          option
            .setName("moderation")
            .setDescription("Le salon de modération")
            .setRequired(false))
        .addChannelOption(option =>
          option
            .setName("announcements")
            .setDescription("Le salon des annonces")
            .setRequired(false))
        .addChannelOption(option =>
          option
            .setName("updates")
            .setDescription("Le salon des mises à jour")
            .setRequired(false)))
    // Sous-commande pour la langue
    .addSubcommand(subcommand =>
      subcommand
        .setName("language")
        .setDescription("Configure la langue du bot")
        .addStringOption(option =>
          option
            .setName("lang")
            .setDescription("La langue à utiliser")
            .setRequired(true)
            .addChoices(
              { name: "Français", value: "fr" },
              { name: "English", value: "en" }
            )))
    // Sous-commande pour la vérification des comptes
    .addSubcommand(subcommand =>
      subcommand
        .setName("verification")
        .setDescription("Configure la vérification des nouveaux membres")
        .addBooleanOption(option =>
          option
            .setName("enabled")
            .setDescription("Activer ou désactiver la vérification")
            .setRequired(true))),

  async execute(interaction, server) {
    const config = server.config;
    const useTranslate = require("../i18n");
    const { t } = useTranslate(config.guildLanguage);

    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "channels":
          await handleChannelsConfig(interaction, config, t);
          break;
        case "language":
          await handleLanguageConfig(interaction, config, t);
          break;
        case "verification":
          await handleVerificationConfig(interaction, config, t);
          break;
      }
    } catch (error) {
      console.error("Erreur lors de la configuration :", error);
      await interaction.reply({
        content: t("❌ Une erreur est survenue lors de la configuration."),
        ephemeral: true,
      });
    }
  },
};

async function handleChannelsConfig(interaction, config, t) {
  const welcomeChannel = interaction.options.getChannel("welcome");
  const logsChannel = interaction.options.getChannel("logs");
  const moderationChannel = interaction.options.getChannel("moderation");
  const announcementsChannel = interaction.options.getChannel("announcements");
  const updatesChannel = interaction.options.getChannel("updates");

  const changes = [];
  if (welcomeChannel) {
    config.welcomeChannel = welcomeChannel.id;
    changes.push({ name: t("Salon de bienvenue"), value: welcomeChannel.toString() });
  }
  if (logsChannel) {
    config.logsChannel = logsChannel.id;
    changes.push({ name: t("Salon de logs"), value: logsChannel.toString() });
  }
  if (moderationChannel) {
    config.moderationLogsChannel = moderationChannel.id;
    changes.push({ name: t("Salon de modération"), value: moderationChannel.toString() });
  }
  if (announcementsChannel) {
    config.announcementsChannel = announcementsChannel.id;
    changes.push({ name: t("Salon des annonces"), value: announcementsChannel.toString() });
  }
  if (updatesChannel) {
    config.updatesChannel = updatesChannel.id;
    changes.push({ name: t("Salon des mises à jour"), value: updatesChannel.toString() });
  }

  if (changes.length === 0) {
    return interaction.reply({
      content: t("❌ Aucun salon n'a été spécifié pour la configuration."),
      ephemeral: true,
    });
  }

  await config.save();

  const embed = new EmbedBuilder()
    .setTitle(t("✅ Configuration des salons mise à jour"))
    .setDescription(t("Les changements suivants ont été effectués :"))
    .setColor(colorTable.success)
    .addFields(changes)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleLanguageConfig(interaction, config, t) {
  const language = interaction.options.getString("lang");
  config.guildLanguage = language;
  await config.save();

  const embed = new EmbedBuilder()
    .setTitle(t("✅ Langue mise à jour"))
    .setDescription(t("La langue du bot a été changée pour : ") + (language === "fr" ? "Français" : "English"))
    .setColor(colorTable.success)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleVerificationConfig(interaction, config, t) {
  const enabled = interaction.options.getBoolean("enabled");
  config.accountCheckEnabled = enabled;
  await config.save();

  const embed = new EmbedBuilder()
    .setTitle(t("✅ Vérification des comptes mise à jour"))
    .setDescription(t("La vérification des nouveaux membres est maintenant ") + 
      (enabled ? t("activée") : t("désactivée")))
    .setColor(colorTable.success)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
