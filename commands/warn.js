const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const isBot = require("../utils/isBot");
const ServerConfig = require("../models/serverConfig");
const { v4: uuidv4 } = require("uuid");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user for breaking the rules.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the warning.")
        .setRequired(false)
    ),
  async execute(interaction, server) {
    const guild = interaction.guild;
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "Aucune raison spécifiée";

    try {
      // Récupérer les données du serveur et les configurations
       
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionFlagsBits.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: t(
            "❌ Je n'ai pas la permission nécessaire pour éxecuter cette commande. Veuillez vérifier mes permissions **Moderate Members**."
          ),
          ephemeral: true,
        });
      }

      // Vérifications initiales
      if (!guild) {
        return interaction.reply({
          content: t(
            "❌ Cette commande ne peut être exécutée que dans un serveur."
          ),
          ephemeral: true,
        });
      }
      if (isBot(user)) {
        return interaction.reply({
          content: t("❌ Vous ne pouvez pas avertir un bot."),
          ephemeral: true,
        });
      }
      if (user.id === interaction.user.id) {
        return interaction.reply({
          content: t("❌ Vous ne pouvez pas vous avertir vous-même."),
          ephemeral: true,
        });
      }
      const config = server.config;

      const logsChannel = guild.channels.cache.get(config.moderationLogsChannel);
      const caseId = uuidv4();

      // Trouver ou créer les warnings de l'utilisateur
      let userWarnings = server.warnings.find((w) => w.userId === user.id);
      if (!userWarnings) {
        userWarnings = { userId: user.id, warns: [] };
        server.warnings.push(userWarnings);
      }

      // Ajouter le warning dans la liste (mémoire)
      const newWarning = {
        case_id: caseId,
        reason,
        moderator: interaction.user.displayName,
        date: new Date(),
      };
      userWarnings.warns.push(newWarning);

      // Vérifier et appliquer les sanctions si nécessaires
      if (config.warnSanctionLevels.enabled) {
        const updatedConfig = await ServerConfig.findById(server.config);
        const applicableRule = updatedConfig.warnSanctionLevels.levels.find(
          (rule) => userWarnings.warns.length === rule.limit - 1
        );

        if (applicableRule) {
          const embed = new EmbedBuilder()
            .setColor(colorTable.warning)
            .setTitle(t("Sanction automatique"))
            .setFooter({ text: `Case ID: ${caseId}` })
            .setTimestamp();

          // Appliquer la sanction correspondante
          switch (applicableRule.action) {
            case "kick":
              await guild.members.kick(
                user,
                `${t("Sanction automatique")} : ${applicableRule.message}`
              );
              embed.setDescription(
                `⚠️ ${t("L'utilisateur")} <@${user}> ${t(
                  "a été expulsé pour avoir atteint"
                )} ${applicableRule.limit} warnings.`
              );
              break;

            case "ban":
              await guild.members.ban(user, {
                reason: `${t("Sanction automatique")} : ${
                  applicableRule.message
                }`,
              });
              embed.setDescription(
                `⚠️ ${t("L'utilisateur")} <@${user}> ${t(
                  "a été expulsé pour avoir atteint"
                )} ${applicableRule.limit} warnings.`
              );
              break;

            case "role-add":
              const roleAdd = guild.roles.cache.get(applicableRule.roleId);
              if (roleAdd) {
                const member = guild.members.cache.get(user.id);
                await member.roles.add(roleAdd, t("Sanction automatique"));
                embed.setDescription(
                  `⚠️ ${t("Le rôle")} <@&${applicableRule.roleId}> ${t(
                    "a été ajouté à"
                  )} ${user} ${t("pour avoir atteint")} ${
                    applicableRule.limit
                  } warnings.`
                );
              }
              break;

            case "role-remove":
              const roleRemove = guild.roles.cache.get(applicableRule.roleId);
              if (roleRemove) {
                const member = guild.members.cache.get(user.id);
                await member.roles.remove(
                  roleRemove,
                  t("Sanction automatique")
                );
                embed.setDescription(
                  `⚠️ ${t("Le rôle")} <@&${applicableRule.roleId}> ${t(
                    "a été retiré à"
                  )} ${user} ${t("pour avoir atteint")} ${
                    applicableRule.limit
                  } warnings.`
                );
              }
              break;

            default:
              embed.setDescription(
                t("Aucune action définie pour cette règle.")
              );
              break;
          }

          // Envoyer les logs
          if (logsChannel) {
            logsChannel.send({ embeds: [embed] });
          }
        }
      }

      // Sauvegarder les données après application des sanctions
      await server.save();

      // Notifier l'utilisateur
      try {
        await user.send({
          content: `⚠️ ${t(
            "Vous avez reçu un avertissement sur le serveur"
          )} **${guild.name}** : "${reason}".`,
        });
      } catch {
        console.error(`${t("Impossible d'envoyer un DM à")} ${user.tag}.`);
      }

      // Répondre à l'administrateur
      interaction.reply({
        content: `⚠️ ${user} ${t("a été averti pour")} : ${reason}`,
        ephemeral: true,
      });

      // Log l'avertissement
      if (logsChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(colorTable.warning)
          .setTitle(t("Avertissement émis"))
          .addFields(
            {
              name: t("Utilisateur"),
              value: `${user.tag} (${user.id})`,
              inline: true,
            },
            {
              name: t("Modérateur"),
              value: interaction.user.tag,
              inline: true,
            },
            { name: t("Raison"), value: reason, inline: false }
          )
          .setFooter({ text: `Case ID: ${caseId}` })
          .setTimestamp();

        logsChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande warn :", error);
      interaction.reply({
        content: t("❌ Une erreur est survenue lors de l'avertissement."),
        ephemeral: true,
      });
    }
  },
};
