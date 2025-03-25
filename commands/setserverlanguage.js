const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
  } = require("discord.js");

  const colorTable = require("../utils/colorTable");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("set-serveur-language")
      .setDescription("Set the bot language for the server.")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Réservée aux administrateurs
      .addStringOption((option) =>
        option
          .setName("language")
          .setDescription("Set the bot language.")
          .addChoices([
            { name: "Français", value: "fr" },
            { name: "English", value: "en" },
          ])
          .setRequired(true)
      ),
      
  
    async execute(interaction, server) {

      // Récupération des options
      const guildLanguage = interaction.options.getString("language");
  
      try {
       
          // Récupère la configuration associée
        let config = server.config;
  
        // Met à jour les champs spécifiés
        if (guildLanguage) config.guildLanguage = guildLanguage;
        
  
        await config.save();
  
        let useTranslate = require("../i18n");
        let { t } = useTranslate(server.config.guildLanguage);
  
        // Répondre avec un récapitulatif
        const embed = new EmbedBuilder()
          .setTitle(`🛠️ ${t("Langue du serveur mise à jour")}`)
          .setDescription(`${t("Voici la configuration actuelle du serveur :")}`)
          .setColor(colorTable.success)
          .addFields(
            {
              name: `${t("Langue du bot")}`,
              value: guildLanguage ? `${guildLanguage==="en"? "English": "Français"}` : `${t("Non défini")}`,
            }
  
          )
          .setTimestamp();
  
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error("❌ Erreur lors de la configuration :", error);
        await interaction.reply({
          content: `❌ ${t(
            "Une erreur s'est produite lors de la configuration."
          )}`,
          ephemeral: true,
        });
      }
    },
  };
  