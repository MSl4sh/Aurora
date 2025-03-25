const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Create a reminder.")
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of the reminder (e.g. 10s, 5m, 2h, 1d).")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message to remind.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const durationInput = interaction.options.getString("duration");
    const message = interaction.options.getString("message");
    const user = interaction.user;
    const useTranslate = require("../i18n");
    const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

    // Fonction pour convertir la durée en millisecondes
    const parseDuration = (input) => {
      const match = input.match(/^(\d+)([smhd])$/); // s: secondes, m: minutes, h: heures, d: jours
      if (!match) return null;

      const value = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case "s":
          return value * 1000; // secondes
        case "m":
          return value * 60 * 1000; // minutes
        case "h":
          return value * 60 * 60 * 1000; // heures
        case "d":
          return value * 24 * 60 * 60 * 1000; // jours
        default:
          return null;
      }
    };

    // Convertir la durée en millisecondes
    const duration = parseDuration(durationInput);

    // Durée maximale : 7 jours
    const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

    if (!duration || duration <= 0 || duration > maxDuration) {
      return interaction.reply({
        content: t(
          "⏰ Format de durée invalide ou dépassant la limite. Utilisez un format comme 10s, 5m, 2h, ou 1d (max : 7 jours)."
        ),
        ephemeral: true,
      });
    }

    // Répondre immédiatement pour confirmer que le rappel a été pris en compte
    await interaction.reply({
      content: `${t(
        "⏳ Rappel créé ! Je te rappellerai dans"
      )} **${durationInput}**.`,
      ephemeral: true,
    });

    // Planifier le rappel
    setTimeout(async () => {
      try {
        // Essayer d'envoyer le message en MP
        await user.send(`${t("⏰ **Rappel :**")} ${message}`);
      } catch (error) {
        console.error("Erreur lors de l'envoi du rappel :", error);

        // Fallback public : poster le rappel dans le canal d'origine
        await interaction.followUp({
          content: `${t("⏰ **Rappel pour")} ${user}:** ${message} ${t(
            "(Envoi en MP échoué)."
          )}`,
          ephemeral: false,
        });
      }
    }, duration);
  },
};
