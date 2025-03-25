const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription(
      "Silence a member for a certain period of time. (28 days maximum)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member to mute.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the mute.")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, server) {
    const target = interaction.options.getMember("user");
    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée";
    const timeoutDuration = 28 * 24 * 60 * 60 * 1000; // 28 jours en millisecondes
    const config = server.config;

    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: `❌ ${t(
            "Je n'ai pas la permission de gérer les membres. Veuillez vérifier mes permissions."
          )}`,
          ephemeral: true,
        });
      }

      if (target.user.bot) {
        return interaction.reply({
          content: `❌ ${t("Vous ne pouvez pas mute un bot.")}`,
          ephemeral: true,
        });
      }

      if (
        interaction.member.roles.highest.position <=
        target.roles.highest.position
      ) {
        return interaction.reply({
          content: `❌ ${t(
            "Vous ne pouvez pas mute un membre ayant un rôle supérieur ou égal au vôtre."
          )}`,
          ephemeral: true,
        });
      }

      if (
        target.permissions.has(PermissionFlagsBits.Administrator) ||
        target.permissions.has(PermissionFlagsBits.ManageMessages)
      ) {
        return interaction.reply({
          content: `❌ ${t("Vous ne pouvez pas mute un modérateur.")}`,
          ephemeral: true,
        });
      }
      // Appliquer le timeout
      await target.timeout(timeoutDuration, reason);

      const embed = new EmbedBuilder()
        .setColor(colorTable.danger)
        .setTitle(`🔇 ${t("Mute")}`)
        .addFields(
          { name: `${t("Membre")}`, value: target, inline: true },
          {
            name: `${t("Durée")}`,
            value: `${t("28 jours maximum")}`,
            inline: true,
          },
          { name: `${t("Raison")}`, value: reason, inline: true },
          {
            name: `${t("Modérateur")}`,
            value: `${interaction.user}`,
            inline: true,
          }
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
        console.warn(`Le canal des logs "${logsChannel}" est introuvable.`);
      }
    } catch (error) {
      console.error("Erreur lors de l'application du timeout :", error);
      interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de l'application du timeout."
        )}`,
        ephemeral: true,
      });
    }
  },
};
