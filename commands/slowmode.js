const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slow-mode")
    .setDescription("Set the slowmode for a channel or all text channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "The duration of the slowmode in seconds (0 to disable)."
        )
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to set the slowmode in.")
        .setRequired(false)
    ),
  async execute(interaction, server) {
    const duration = interaction.options.getInteger("duration");
    const targetChannel = interaction.options.getChannel("channel");
    const author = interaction.member;
    const config = server.config;

    try {
 
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ManageChannels
        )
      ) {
        return interaction.reply({
          content: t(
            "❌ Je n'ai pas la permission de gérer les salons. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }

      if (duration < 0) {
        return interaction.reply({
          content: t(
            "❌ La durée doit être un nombre positif ou 0 pour désactiver le slowmode."
          ),
          ephemeral: true,
        });
      }
      let channelsUpdated = [];

      if (targetChannel) {
        // Applique le slowmode à un canal spécifique
        if (!targetChannel.isTextBased()) {
          return interaction.reply({
            content: t(
              "❌ Vous ne pouvez appliquer le slowmode qu'à des salons texte."
            ),
            ephemeral: true,
          });
        }

        await targetChannel.setRateLimitPerUser(duration);
        channelsUpdated.push(targetChannel);

        await interaction.reply({
          content: `${t(
            "✅ Slowmode mis à jour pour"
          )} ${targetChannel} : ${duration} secondes.`,
          ephemeral: false,
        });
      } else {
        // Applique le slowmode à tous les salons texte du serveur
        const textChannels = interaction.guild.channels.cache.filter(
          (channel) => channel.isTextBased()
        );
        const promises = textChannels.map(async (channel) => {
          await channel.setRateLimitPerUser(duration);
          channelsUpdated.push(channel);
        });

        await Promise.all(promises);

        await interaction.reply({
          content: `${t(
            "✅ Slowmode mis à jour pour tous les salons texte du serveur :"
          )} ${duration} secondes.`,
          ephemeral: false,
        });
      }

      // Préparer l'embed pour les logs
      const embed = new EmbedBuilder()
        .setTitle(t("🕒 Slowmode configuré"))
        .setDescription(
          `${t("Le slowmode a été configuré par")} ${author.displayName}.`
        )
        .addFields(
          { name: t("Durée"), value: `${duration} secondes`, inline: true },
          {
            name: t("Canaux modifiés"),
            value:
              channelsUpdated.map((ch) => ch.name).join(", ") || t("Aucun"),
            inline: false,
          }
        )
        .setColor(duration > 0 ? colorTable.warning : colorTable.success) // Vert pour désactiver, orange pour activer
        .setTimestamp();

      // Envoyer l'embed dans le canal des logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      if (logsChannel) {
        logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Erreur lors de la configuration du slowmode :", error);
      return interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de la configuration du slowmode."
        ),
        ephemeral: true,
      });
    }
  },
};
