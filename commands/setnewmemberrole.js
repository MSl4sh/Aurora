const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-new-member-role")
    .setDescription("Set the role to be given to new members.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to be given to new members.")
        .setRequired(true)
    ),

  async execute(interaction, server) {
    const role = interaction.options.getRole("role");

    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ManageRoles
        )
      ) {
        return interaction.reply({
          content: t(
            "❌ Je n'ai pas la permission de gérer les rôles. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }
      const config = server.config;
      if (!config) {
        return interaction.reply({
          content: t("❌ La configuration du serveur est introuvable."),
          ephemeral: true,
        });
      }
      config.newMemberRole = role.id;
      await config.save();

      // Embed dans le canal des logs
      const logChannel = interaction.guild.channels.cache.find(
        (ch) => ch.id === config.logsChannel
      );

      const logEmbed = new EmbedBuilder()
        .setColor(colorTable.success)
        .setTitle(t("Attribution de rôle pour les nouveaux membres"))
        .addFields(
          { name: t("Rôle attribué"), value: `${role.name}`, inline: true },
          {
            name: t("Attribué par"),
            value: `${interaction.user.displayName} (${interaction.user.id})`,
          }
        )
        .setTimestamp();

      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
      }

      // Répondre à l'utilisateur
      await interaction.reply({
        content: `${t("✅ Le rôle **")}${role.name}** ${t(
          "sera désormais attribué aux nouveaux membres."
        )}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erreur lors de l'attribution du rôle :", error);
      await interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de l'attribution du rôle. Vérifiez mes permissions et réessayez."
        ),
        ephemeral: true,
      });
    }
  },
};
