const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const useTranslate = require("../i18n"); // Import de la fonction de traduction

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reaction-role")
    .setDescription("Set a role based on a reaction to a message.") // Texte original utilisé comme clé
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("messageid")
        .setDescription("ID of the message") // Texte original utilisé comme clé
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("emoji")
        .setDescription("The Emoji to check (exemple : 😀 or :smile:).") // Texte original utilisé comme clé
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to give.") // Texte original utilisé comme clé
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const config = server.config;
    const { t } = useTranslate(server.config.guildLanguage==='en'? "en":""); // Utilisation de la langue du serveur
    const messageId = interaction.options.getString("messageid");
    const emoji = interaction.options.getString("emoji");
    const role = interaction.options.getRole("role");

    // Vérification du rôle
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: t(
          "❌ Je ne peux pas gérer ce rôle. Assurez-vous que mon rôle est plus élevé."
        ),
        ephemeral: true,
      });
    }

    if (role.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: t(
          "❌ Tu ne peux pas gérer ce rôle. Assure-toi que ton rôle est plus élevé."
        ),
        ephemeral: true,
      });
    }

    if (!/^\d{17,19}$/.test(messageId)) {
      return interaction.reply({
        content: t(
          "❌ L'ID du message fourni n'est pas valide. Assurez-vous de fournir un ID numérique correct."
        ),
        ephemeral: true,
      });
    }

    try {
      const channel = interaction.channel;
      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return interaction.reply({
          content: t(
            "❌ Message introuvable. Assurez-vous que l'ID est correct."
          ),
          ephemeral: true,
        });
      }

      // Mise à jour de la configuration
      if (!config.reactionRoles) config.reactionRoles = [];

      config.reactionRoles.push({
        messageId,
        emoji,
        roleId: role.id,
      });

      await config.save();

      return interaction.reply({
        content: `${t("✅ Le rôle a été configuré avec succès.")} ${
          role.name
        } ${t("sera attribué lors de la réaction avec")} ${emoji}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la configuration de la commande reactionrole :",
        error
      );
      return interaction.reply({
        content: t("❌ Une erreur s'est produite lors de la configuration."),
        ephemeral: true,
      });
    }
  },
};
