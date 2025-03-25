const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription(
      "Unmute a user who has been muted by the bot."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unmute.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, server) {
    const target = interaction.options.getMember("user");
    const config = server.config;

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
            "❌ Je n'ai pas la permission de gérer les membres. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }

      // Vérifications
      if (!target) {
        return interaction.reply({
          content: t("❌ Utilisateur introuvable."),
          ephemeral: true,
        });
      }

      if (!target.communicationDisabledUntil) {
        return interaction.reply({
          content: `❌ <@${target.displayName}> ${t(
            "n'est pas actuellement mute."
          )}`,
          ephemeral: true,
        });
      }
      // Retirer le timeout
      await target.timeout(null);

      const embed = new EmbedBuilder()
        .setColor(colorTable.success)
        .setTitle(t("🔊 Membre unmuté"))
        .addFields(
          { name: t("Membre"), value: `${target}`, inline: true },
          { name: t("Modérateur"), value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Envoi de l'embed dans le canal des logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      if (logsChannel) {
        await logsChannel.send({ embeds: [embed] });
      } else {
        console.warn(
          `${t("Le canal des logs")} "${logsChannelName}" ${t(
            "est introuvable."
          )}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la levée du timeout :", error);
      interaction.reply({
        content: t("❌ Une erreur est survenue lors la tentative de unmute"),
        ephemeral: true,
      });
    }
  },
};
