const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn-level")
    .setDescription(
      "Enable or disable automatic sanctions based on warns."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addBooleanOption((option) =>
      option
        .setName("status")
        .setDescription("Enable or disable the automatic sanctions based on warns.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    // Récupérer l'état spécifié par l'utilisateur
    const status = interaction.options.getBoolean("status");


    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.followUp({
          content: t(
            "❌ Je n'ai pas la permission nécessaire pour éxecuter cette commande. Veuillez vérifier mes permissions **Moderate Members**."
          ),
          ephemeral: true,
        });
      }
      // Mettre à jour ou créer la configuration du serveur
      const config = server.config;
      if (!config) {
        const newConfig = new ServerConfig({
          guildId: interaction.guild.id,
          guildName: interaction.guild.name,
        });
        await newConfig.save();
      }

      if (config.warnSanctionLevels.enabled === status) {
        return interaction.reply({
          content: `❌ ${t(
            "Les sanctions automatiques basées sur les warns sont déjà"
          )} **${status ? t("activées") : t("désactivées")}**.`,
          ephemeral: true,
        });
      }

      // Mettre à jour la configuration
      config.warnSanctionLevels.enabled = status;
      await config.save();

      // Répondre à l'utilisateur
      interaction.reply({
        content: `✅ ${t(
          "Les sanctions automatiques basées sur les warns sont maintenant"
        )} **${status ? t("activées") : t("désactivées")}**.`,
        ephemeral: true, // Message privé pour l'utilisateur
      });

      // Optionnel : Enregistrer dans un canal de logs
      if (config.logsChannel) {
        const logsChannel = interaction.guild.channels.cache.get(
          config.logsChannel
        );
        if (logsChannel) {
          logsChannel.send({
            content: `⚙️ ${t(
              "Les sanctions automatiques basées sur les warns ont été"
            )} ${status ? t("activées") : t("désactivées")} ${t("par")} ${
              interaction.user.displayName
            }.`,
          });
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des sanctions automatiques :",
        error
      );
      interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de la mise à jour des sanctions automatiques."
        ),
        ephemeral: true,
      });
    }
  },
};
