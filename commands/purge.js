const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Delete a number of messages from the current channel or from a specific user."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Number of messages to delete")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to delete messages from")
        .setRequired(false)
    ),
  async execute(interaction, server) {

    const config = server.config;
    const amount = interaction.options.getInteger("number");
    const targetUser = interaction.options.getUser("user");

    try {
      

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (!interaction.guild.members.me.permissions.has("ManageMessages")) {
        return interaction.reply({
          content: `❌ ${t(
            "Je n'ai pas la permission de supprimer les messages."
          )}`,
          ephemeral: true,
        });
      }

      if (amount < 1 || amount > 100) {
        return interaction.reply({
          content: `❌ ${t(
            "Le nombre de messages à supprimer doit être compris entre 1 et 100."
          )}`,
          ephemeral: true,
        });
      }
      let deletedMessagesCount = 0;

      if (targetUser) {
        const messages = await interaction.channel.messages.fetch({
          limit: 100,
        });
        const userMessages = Array.from(
          messages.filter((msg) => msg.author.id === targetUser.id).values()
        ).slice(0, amount);

        if (userMessages.length === 0) {
          return interaction.reply({
            content: `⚠️ ${t("Aucun message récent trouvé de")} ${
              targetUser.tag
            }.`,
            ephemeral: true,
          });
        }

        const deletedMessages = await interaction.channel.bulkDelete(
          userMessages,
          true
        );
        deletedMessagesCount = deletedMessages.size;
      } else {
        const deletedMessages = await interaction.channel.bulkDelete(
          amount,
          true
        );
        deletedMessagesCount = deletedMessages.size;
      }

      interaction.reply({
        content: `✅ ${deletedMessagesCount} ${t("message(s) supprimé(s).")}`,
        ephemeral: true,
      });

      // Logs (embed)
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      if (logsChannel) {
        const embed = new EmbedBuilder()
          .setColor(colorTable.success)
          .setTitle(`🗑️ ${t("Messages supprimés")}`)
          .addFields(
            {
              name: `${t("Demandé par")}`,
              value: `${interaction.member.displayName} (${interaction.user.displayName})`,
              inline: true,
            },
            {
              name: `${t("Messages supprimés")}`,
              value: `${deletedMessagesCount}`,
            },
            ...(targetUser
              ? [
                  {
                    name: `${t("Utilisateur ciblé")}`,
                    value: `<@${targetUser.displayName}> (${targetUser.id})`,
                    inline: true,
                  },
                ]
              : [])
          )
          .setTimestamp()
          .setFooter({ text: `${t("Canal")} : ${interaction.channel.name}` });

        logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(
        `Erreur lors de la suppression des messages : ${error.message}`
      );
      interaction.reply({
        content: `❌${t(
          "Une erreur est survenue lors de la suppression des messages"
        )}`,
        ephemeral: true,
      });
    }
  },
};
