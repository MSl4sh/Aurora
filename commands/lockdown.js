const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

let isLockedDown = false; // État global pour suivre le statut du lockdown

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Enable or disable the lockdown.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "The duration of the lockdown in minutes. Set to 0 to disable."
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the lockdown.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
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
    const duration = interaction.options.getInteger("duration");
    const reason = interaction.options.getString("reason");
    const guild = interaction.guild;
    const serverConfig = server.config;

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ Aucune donnée trouvée pour ce serveur.`,
          ephemeral: true,
        });
      }

      const useTranslate = require("../i18n");
      const { t } = useTranslate(serverConfig.guildLanguage);
      const announcementChannel = guild.channels.cache.find(
        (channel) => channel.id === serverConfig.announcementsChannel
      );
      const logsChannel = guild.channels.cache.find(
        (channel) => channel.id === serverConfig.moderationLogsChannel
      );

      if (!isLockedDown) {
        // Activer le lockdown
        const timeoutDuration = duration * 60 * 1000; // Convertir la durée en millisecondes

        // Fetch tous les membres du serveur
        const members = await guild.members.fetch();

        // Filtrer les membres éligibles pour le timeout
        const membersToTimeout = members.filter(
          (member) =>
            !member.permissions.has(PermissionFlagsBits.Administrator) &&
            !member.user.bot &&
            !member.permissions.has(PermissionFlagsBits.ModerateMembers)
        );

        if (!membersToTimeout.size) {
          return interaction.reply({
            content: `❌${t("Aucun membre éligible pour le timeout.")}`,
            ephemeral: true,
          });
        }

        // Appliquer un timeout à chaque membre
        const promises = membersToTimeout.map(async (member) => {
          if (!member.communicationDisabledUntil) {
            await member.timeout(timeoutDuration, reason);
          }
        });

        await Promise.all(promises);

        // Annonce pour signaler le lockdown
        if (announcementChannel) {
          await announcementChannel.send(
            `🔒${t(
              " **Lockdown activé !**: Le serveur est actuellement en lockdown pour"
            )} **${duration}** ${t("minute(s).")}`
          );
        }

        // Embed de log
        const embed = new EmbedBuilder()
          .setColor(colorTable.danger)
          .setTitle(`🔒 ${t("Lockdown activé")}`)
          .addFields(
            {
              name: `${t("Durée")}`,
              value: `${duration} minute(s)`,
              inline: true,
            },
            { name: `${t("Raison")}`, value: reason, inline: true },
            {
              name: `${t("Modérateur")}`,
              value: `${interaction.user}`,
              inline: true,
            }
          )
          .setTimestamp();

        if (logsChannel) {
          await logsChannel.send({ embeds: [embed] });
        }

        await interaction.reply({
          content: `🔒 ${t(
            "Le lockdown a été activé pour"
          )} **${duration}** ${t("minute(s).")}`,
          ephemeral: true,
        });

        isLockedDown = true; // Mettre à jour l'état
      } else {
        // Désactiver le lockdown
        const members = await guild.members.fetch();

        // Filtrer les membres en timeout
        const membersToRemoveTimeout = members.filter(
          (member) => member.communicationDisabledUntil
        );

        if (!membersToRemoveTimeout.size) {
          return interaction.reply({
            content: `❌ ${t("Aucun membre en timeout.")}`,
            ephemeral: true,
          });
        }

        // Lever le timeout pour tous les membres concernés
        const promises = membersToRemoveTimeout.map(async (member) => {
          await member.timeout(null);
        });

        await Promise.all(promises);

        // Annonce pour signaler la fin du lockdown
        if (announcementChannel) {
          await announcementChannel.send(
            `🔓 ${t("Le lockdown a été désactivé.")}`
          );
        }

        // Embed de log
        const embed = new EmbedBuilder()
          .setColor(colorTable.success)
          .setTitle(`🔓 ${t("Lockdown désactivé")}`)
          .addFields({
            name: `${t("Modérateur")}`,
            value: `${interaction.user}`,
            inline: true,
          })
          .setTimestamp();

        if (logsChannel) {
          await logsChannel.send({ embeds: [embed] });
        }

        await interaction.reply({
          content: `🔓 ${t("Le lockdown a été désactivé.")}`,
          ephemeral: true,
        });

        isLockedDown = false; // Réinitialiser l'état
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution du lockdown :", error);
      interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de l'exécution du lockdown."
        )}`,
        ephemeral: true,
      });
    }
  },
};
