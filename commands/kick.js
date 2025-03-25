const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
        .setRequired(false)
    ),
  async execute(interaction, server) {
 
    const config = server.config;
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée";

    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.KickMembers
        )
      ) {
        return interaction.reply({
          content: `❌ ${t(
            "Je n'ai pas la permission d'expulser des membres. Veuillez vérifier mes permissions."
          )}`,
          ephemeral: true,
        });
      }

      if (isBot(user)) {
        return interaction.reply({
          content: `❌ ${t("Vous ne pouvez pas expulser un bot.")}`,
          ephemeral: true,
        });
      }

      if (user.id === interaction.user.id) {
        return interaction.reply({
          content: `❌ ${t("Vous ne pouvez pas vous expulser vous-même.")}`,
          ephemeral: true,
        });
      }

      const member = interaction.guild.members.cache.get(user.id);

      if (!member) {
        return interaction.reply({
          content: `❌ ${t(
            "Impossible de trouver l'utilisateur mentionné sur ce serveur."
          )}`,
          ephemeral: true,
        });
      }
      await member.kick(reason);
      await interaction.reply(
        `✅ ${user.tag} ${t("a été expulsé pour")} : ${reason}`
      );

      // Logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      const canSendToLogs = logsChannel
        .permissionsFor(botAsMember)
        ?.has(PermissionFlagsBits.SendMessages);

      if (logsChannel) {
        if (!canSendToLogs) {
          return interaction.reply({
            content: `❌ ${t(
              "Je n'ai pas la permission d'envoyer des messages dans le salon de logs."
            )}`,
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(colorTable.danger)
          .setTitle(`🚪 ${t("Expulsion")}`)
          .addFields(
            {
              name: `${t("Utilisateur expulsé")}`,
              value: `<@${user.displayName}> (${user.id})`,
              inline: true,
            },
            {
              name: `${t("Modérateur")}`,
              value: `${interaction.user.displayName}`,
              inline: true,
            },
            { name: `${t("Raison")}`, value: reason, inline: false }
          )
          .setTimestamp();

        logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de l'expulsion de l'utilisateur."
        )}`,
        ephemeral: true,
      });
    }
  },
};
