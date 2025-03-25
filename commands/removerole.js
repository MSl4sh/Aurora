const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-role")
    .setDescription("Remove a role from a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove the role from.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to remove.")
        .setRequired(true)
    ),

  async execute(interaction, server) {
    const utilisateur = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");

    const member = interaction.guild.members.cache.get(utilisateur.id);

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ La configuration du serveur est introuvable.`,
          ephemeral: true,
        });
      }

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

      // Vérifications
      if (!member) {
        return interaction.reply({
          content: t(
            "❌ Impossible de trouver l'utilisateur mentionné sur ce serveur."
          ),
          ephemeral: true,
        });
      }

      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `❌ ${t("L'utilisateur n'a pas le rôle **")}${role.name}**.`,
          ephemeral: true,
        });
      }

      if (
        interaction.member.roles.highest.position <= role.position &&
        !interaction.guild.ownerId === interaction.user.id
      ) {
        return interaction.reply({
          content: t(
            "❌ Vous ne pouvez pas retirer un rôle supérieur ou égal à votre rôle le plus élevé."
          ),
          ephemeral: true,
        });
      }

      if (
        interaction.guild.members.me.roles.highest.position <= role.position
      ) {
        return interaction.reply({
          content: t(
            "❌ Mon rôle doit être supérieur à celui que vous essayez de retirer."
          ),
          ephemeral: true,
        });
      }
      // Retirer le rôle
      await member.roles.remove(role);

      // Répondre à l'utilisateur
      await interaction.reply({
        content: `✅ ${t("Le rôle **")}${role.name}${t(
          "** a été retiré de **"
        )}${utilisateur.displayName}${t("** avec succès !")}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erreur lors du retrait du rôle :", error);
      await interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors du retrait du rôle. Vérifiez mes permissions et réessayez."
        ),
        ephemeral: true,
      });
    }
  },
};
