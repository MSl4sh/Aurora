const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-warn-level")
    .setDescription("Add a new warn sanction level.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of warns before the action is taken.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription(
          "Action to take when the limit is reached."
        )
        .setRequired(true)
        .addChoices(
          { name: "Warn", value: "warn" },
          { name: "Kick", value: "kick" },
          { name: "Ban", value: "ban" },
          { name: "Add a role", value: "role-add" },
          { name: "Remove a role", value: "role-remove" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message personnalisé pour ce palier.")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Rôle cible (nécessaire pour role-add et role-remove).")
        .setRequired(false)
    ),
  async execute(interaction, server) {
    // Récupérer les options
    const limit = interaction.options.getInteger("limit");
    const action = interaction.options.getString("action");
    const message =
      interaction.options.getString("message") ||
      "Pas de message personnalisé.";
    const role = interaction.options.getRole("role");

    if (
      !interaction.guild.members.me.permissions.has(
        PermissionFlagsBits.ModerateMembers
      )
    ) {
      return interaction.reply({
        content:
          "❌ Je n'ai pas la permission nécessaire pour éxecuter cette commande. Veuillez vérifier mes permissions **Moderate Members**.",
        ephemeral: true,
      });
    }

    try {

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      // Récupérer ou créer la configuration du serveur
      let config = server.config;

      // Limiter à 3 règles maximum
      if (config.warnSanctionLevels.levels.length >= 3) {
        return interaction.reply({
          content: t(
            "❌ Vous ne pouvez pas ajouter plus de 3 règles de sanctions."
          ),
          ephemeral: true,
        });
      }

      // Vérifier les actions nécessitant un rôle
      if ((action === "role-add" || action === "role-remove") && !role) {
        return interaction.reply({
          content: t(
            "❌ Vous devez sélectionner un rôle pour les actions role-add ou role-remove."
          ),
          ephemeral: true,
        });
      }

      // Ajouter la nouvelle règle
      const newRule = {
        limit,
        action,
        message,
        roleId: role ? role.id : null,
      };

      config.warnSanctionLevels.levels.push(newRule);
      await config.save();

      // Répondre à l'utilisateur
      interaction.reply({
        content: `${t(
          "✅ Nouvelle règle ajoutée :"
        )} **${limit} warns** ➡️ **${action}** (${message})`,
        ephemeral: true,
      });

      // Optionnel : Log dans le canal de logs
      if (config.logsChannel) {
        const logsChannel = interaction.guild.channels.cache.get(
          config.moderationLogsChannel
        );
        if (logsChannel) {
          logsChannel.send({
            content: `${t(
              "🛠️ Une nouvelle règle de sanction a été ajoutée :"
            )} **${limit} warns** ➡️ **${action}** (${message})`,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une règle de sanction :", error);
      interaction.reply({
        content: t("❌ Une erreur est survenue lors de l'ajout de la règle."),
        ephemeral: true,
      });
    }
  },
};
