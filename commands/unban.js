const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("ID of the user to unban.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const userId = interaction.options.getString("user");
    const config = server.config;

    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.BanMembers
        )
      ) {
        return interaction.reply({
          content: t(
            "❌ Je n'ai pas la permission de bannir ou de débannir des membres. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }

      if (!interaction.member.permissions.has("BanMembers")) {
        return interaction.reply({
          content: t("❌ Tu n'as pas la permission d'utiliser cette commande."),
          ephemeral: true,
        });
      }
      await interaction.guild.members.unban(userId);
      await interaction.reply(
        `${t("✅ L'utilisateur avec l'ID ")}${userId} ${t("a été débanni.")}`
      );

      // Logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === config.moderationLogsChannel
      );
      if (logsChannel) {
        const embed = new EmbedBuilder()
          .setColor(colorTable.success)
          .setTitle(t("Débannissement"))
          .addFields(
            { name: t("Utilisateur"), value: `ID : <@${userId}>`, inline: true },
            {
              name: t("Modérateur"),
              value: `${interaction.user.tag}`,
              inline: true,
            }
          )
          .setTimestamp();

        logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: t(
          "❌ Une erreur s'est produite lors du débannissement. Assure-toi que l'ID est correct."
        ),
        ephemeral: true,
      });
    }
  },
};
