const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const isBot = require("../utils/isBot");
const colorTable = require("../utils/colorTable")
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("user to ban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the ban.")
        .setRequired(false)
    ),
  async execute(interaction, server) {
    const config = server.config
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée";

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ Aucune donnée trouvée pour ce serveur.`,
          ephemeral: true,
        });
      }

      if (isBot(user)) {
        return interaction.reply({
          content: `❌ Vous ne pouvez pas bannir un bot.`,
          ephemeral: true,
        });
      }

      if (user.id === interaction.user.id) {
        return interaction.reply({
          content: `❌ Vous ne pouvez pas vous bannir vous-même.`,
          ephemeral: true,
        });
      }

      const member = interaction.guild.members.cache.get(user.id);

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.BanMembers
        )
      ) {
        return interaction.reply({
          content: `❌ Je n' ai pas la permission de bannir des membres. Veuillez vérifier mes permissions.`,
          ephemeral: true,
        });
      }

      if (!member) {
        return interaction.reply({
          content: `❌ L'utilisateur n'est pas présent sur le serveur.`,
          ephemeral: true,
        });
      }

      await member.ban({ reason });
      await interaction.reply(
        `✅ ${user.tag} a été banni pour : ${reason}`
      );

      // Logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      if (logsChannel) {
        if (!hasChannelPermissions(logsChannel)) {
          return interaction.reply({
              content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
              ephemeral: true
          });
      }

        const embed = new EmbedBuilder()
          .setColor(colorTable.danger)
          .setTitle(`Utilisateur banni`)
          .addFields(
            {
              name: `Membre`,
              value: `<@${user.displayName}> (${user.id})`,
              inline: true,
            },
            {
              name: `Modérateur`,
              value: `${interaction.user.displayName}`,
              inline: true,
            },
            { name: `Raison`, value: reason, inline: false }
          )
          .setTimestamp();

        logsChannel.send({ embeds: [embed] });
      }else{
        interaction.reply({
          content: `🚫 Impossible de trouver le canal de logs.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: `❌ Une erreur est survenue pendant le bannissement.`,
        ephemeral: true,
      });
    }
  },
};
