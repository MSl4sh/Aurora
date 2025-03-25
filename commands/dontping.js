const { SlashCommandBuilder } = require("discord.js");
const User = require("../models/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dont-ping")
    .setDescription("Enable or disable the anti-ping protection.")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Enable or disable the anti-ping protection.")
        .setRequired(true)
        .addChoices(
          { name: "Activer", value: "enable" },
          { name: "Désactiver", value: "disable" }
        )
    ),
  async execute(interaction, server) {
    const action = interaction.options.getString("action");
    const userId = interaction.user.id;
    const serverConfig = server.config;


    try {
     
      const useTranslate = require("../i18n");
      const { t } = useTranslate(serverConfig.guildLanguage);

      const user = await User.findOne({ guildId: server.guildId, userId });


      if (action === "enable") {

        if (!user) {
          const newUser = new User({
            guildId: server.guildId,
            userId,
            dontPing: true,
          });
          await newUser.save();
          return interaction.reply({
            content: `${t("La protection anti-ping est activée pour vous.")}`,
            ephemeral: true,
          });
        }

        if (user.dontPing) {
          return interaction.reply({
            content: `${t("Vous avez déjà activé la protection anti-ping.")}`,
            ephemeral: true,
          });
        }
      }

      if (action === "disable") {
        if (!user || !user.dontPing) {
          return interaction.reply({
            content: `${t("Vous n'avez pas activé la protection anti-ping.")}`,
            ephemeral: true,
          });
        }
      
        user.dontPing = false;
        await user.save();
        return interaction.reply({
          content: `${t("La protection anti-ping est désactivée pour vous.")}`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `${t(
          "Une erreur est survenue lors de l'exécution de la commande."
        )}`,
        ephemeral: true,
      });
    }
  },
};
