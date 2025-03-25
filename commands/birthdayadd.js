const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birthday-add")
    .setDescription("Add your birthday to the list.")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("Your birthday in the format DD/MM/YYYY.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const dateString = interaction.options.getString("date");
    const userId = interaction.user.id;
    const dateParts = dateString.split("/");
    const birthday = new Date(
      `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    );
    const serverConfig = server.config;

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ ${t("La configuration du serveur est introuvable.")}`,
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const { t } = useTranslate(serverConfig.guildLanguage);

      if (isNaN(birthday)) {
        return interaction.reply({
          content: `❌ ${t(
            "La date d'anniversaire n'est pas valide. Veuillez utiliser le format JJ/MM/AAAA."
          )}`,
          ephemeral: true,
        });
      }
      const existingBirthday = serverConfig.birthdays.find(
        (b) => b.userId === userId
      );

      if (existingBirthday) {
        return interaction.reply({
          content: `❌ ${t(
            "Vous avez déjà enregistré votre date d'anniversaire."
          )}`,
          ephemeral: true,
        });
      }

      serverConfig.birthdays.push({ userId, birthday });
      await serverConfig.save();

      return interaction.reply({
        content: `✅ ${t("Votre date d'anniversaire a été enregistrée.")}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ ${t(
          "Une erreur s'est produite lors de l'enregistrement de votre date d'anniversaire."
        )}`,
        ephemeral: true,
      });
    }
  },
};
