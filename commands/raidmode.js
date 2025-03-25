const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const useTranslate = require("../i18n"); // Import de la fonction de traduction
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raid-mode")
    .setDescription("Enable or disable the anti-raid mode on the server.") // Texte original utilisé comme clé
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addBooleanOption((option) =>
      option
        .setName("status")
        .setDescription("Enable ou disable") // Texte original utilisé comme clé
        .setRequired(true)
    ),

  async execute(interaction, server) {
    try {
      // Récupérer la configuration du serveur et la langue

      const config = server.config;

      // Utiliser la langue du serveur
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: t(
            "Je n'ai pas la permission nécessaire pour exécuter cette commande. Veuillez vérifier mes permissions."
          ),
          ephemeral: true,
        });
      }

      const status = interaction.options.getBoolean("status");
      const logsChannel = interaction.guild.channels.cache.get(
        config.moderationLogsChannel
      );

      if (!logsChannel) {
        return interaction.reply({
          content: t(
            "Le canal des logs n'est pas configuré. Veuillez configurer un canal des logs avant d'activer cette commande."
          ),
          ephemeral: true,
        });
      }

      // Mettre à jour le statut du mode Raid dans la configuration
      config.raidMode = status;
      await config.save();

      if (status) {
        // Désactiver les invitations
        const invites = await interaction.guild.invites.fetch();
        invites.forEach((invite) => invite.delete().catch(console.error));

        // Renforcer le niveau de vérification
        interaction.guild.setVerificationLevel(3).catch(console.error);

        await interaction.reply({
          content: t(
            "Le mode anti-raid est désormais activé. Toutes les invitations ont été supprimées et les nouveaux membres sont soumis à une vérification renforcée."
          ),
          ephemeral: false,
        });

        // Envoyer un message aux administrateurs
        const embed = new EmbedBuilder()
          .setTitle(t("⚠️ Mode Anti-Raid Activé"))
          .setDescription(
            t(
              "Le mode anti-raid est désormais activé. Toutes les invitations ont été supprimées et les nouveaux membres sont soumis à une vérification renforcée."
            )
          )
          .addFields({
            name: t("Activé par:"),
            value: interaction.user.displayName,
            inline: true,
          })
          .setColor(colorTable.warning)
          .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
      } else {
        // Réinitialiser le niveau de vérification
        interaction.guild.setVerificationLevel(1).catch(console.error);

        await interaction.reply({
          content: t(
            "Le mode anti-raid est désormais désactivé. Les restrictions ont été levées."
          ),
          ephemeral: false,
        });

        // Envoyer un message de confirmation
        const embed = new EmbedBuilder()
          .setTitle(t("✅ Mode Anti-Raid Désactivé"))
          .setDescription(
            t(
              "Le mode anti-raid est désormais désactivé. Les restrictions ont été levées."
            )
          )
          .addFields({
            name: t("Désactivé par:"),
            value: interaction.user.displayName,
            inline: true,
          })
          .setColor(colorTable.success)
          .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Erreur dans la commande /raidmode :", error);
      await interaction.reply({
        content: t(
          "Une erreur est survenue lors de l'exécution de la commande."
        ),
        ephemeral: true,
      });
    }
  },
};
