const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hug")
    .setDescription("Hug someone you love.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to hug.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const targetUser = interaction.options.getUser("user");
    const authorUser = interaction.user;


    try {
      
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      // Vérification si la cible est le bot
      if (targetUser.id === interaction.client.user.id) {
        return interaction.reply({
          content: `🤗 ${t("Merci pour le câlin,")} ${
            authorUser.displayName
          } ! ❤️`,
          ephemeral: false,
        });
      }

      // Vérification si la cible est l'auteur lui-même
      if (targetUser.id === authorUser.id) {
        return interaction.reply({
          content: `🤔 ${t(
            "C'est un peu étrange de se câliner soi-même, mais je suppose que tout le monde a besoin d'amour !"
          )} 💞`,
          ephemeral: false,
        });
      }

      // Vérification si la cible est un membre du staff
      const member = await interaction.guild.members.fetch(targetUser.id);
      if (
        member.roles.cache.some(
          (role) =>
            role.name.toLowerCase().includes("modérateur") ||
            role.name.toLowerCase().includes("admin")
        )
      ) {
        return interaction.reply({
          content: `❌ ${t("Vous ne pouvez pas câliner un membre du staff.")}`,
          ephemeral: true,
        });
      }

      // Si aucune des conditions spéciales n'est remplie, envoyer un câlin
      const embed = new EmbedBuilder()
        .setColor("#643ed6")
        .setTitle(`🤗 ${t("Câlin")}`)
        .setDescription(
          `${authorUser.displayName} ${t("a fait un câlin à ")}${targetUser} !`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande /hug :", error);
      await interaction.reply({
        content: `${t(
          "Une erreur est survenue lors de l'exécution de la commande."
        )}`,
        ephemeral: true,
      });
    }
  },
};
