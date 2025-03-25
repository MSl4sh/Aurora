const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-warn-level")
    .setDescription("Delete a warning sanction rule.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((option) =>
      option
        .setName("rule-index")
        .setDescription("The index of the rule to delete. (1 for the first rule, etc.)")
        .setRequired(true)
    ),
  async execute(interaction, server) {

    const config = server.config;
    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ Aucune donnée trouvée pour ce serveur.`,
          ephemeral: true,
        });
      }

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: `❌ ${t("Je n'ai pas la permission de gérer les membres.")}`,
          ephemeral: true,
        });
      }
      // Récupérer l'index de la règle
      const ruleIndex = interaction.options.getInteger("rule-index") - 1;

      // Récupérer la configuration du serveur

      // Vérifier si des règles existent
      if (
        !config ||
        !config.warnSanctionLevels ||
        config.warnSanctionLevels.levels.length === 0
      ) {
        return interaction.reply({
          content: `❌ ${t("Aucune règle de sanction n'a été définie.")}`,
          ephemeral: true,
        });
      }

      // Vérifier si l'index est valide
      if (
        ruleIndex < 0 ||
        ruleIndex >= config.warnSanctionLevels.levels.length
      ) {
        return interaction.reply({
          content: `❌ ${t(
            "L'index de la règle est invalide. Veuillez spécifier un index valide."
          )}`,
          ephemeral: true,
        });
      }

      // Supprimer la règle
      const removedRule = config.warnSanctionLevels.levels.splice(ruleIndex, 1);
      await config.save();

      // Répondre à l'utilisateur
      interaction.reply({
        content: `✅ ${t("La règle de sanction a été supprimée.")} **${
          removedRule[0].limit
        } warns ➡️ ${removedRule[0].action}**`,
        ephemeral: true,
      });

      // Optionnel : Log dans le canal de logs
      if (config.logsChannel) {
        const logsChannel = interaction.guild.channels.cache.get(
          config.logsChannel
        );
        if (!hasChannelPermissions(logsChannel)) {
          return interaction.reply({
              content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}',logsChannel),
              ephemeral: true
          });
      }
        if (logsChannel) {
          logsChannel.send({
            content: `🚫 ${t("Règle de sanction supprimée :")} **${
              removedRule[0].limit
            } warns ➡️ ${removedRule[0].action}**`,
          });
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la suppression d'une règle de sanction :",
        error
      );
      interaction.reply({
        content: `❌ ${t(
          "Une erreur s'est produite lors de la suppression de la règle de sanction."
        )}`,
        ephemeral: true,
      });
    }
  },
};
