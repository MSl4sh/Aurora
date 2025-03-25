const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const Server = require("../models/serverSchema");
const colorTable = require("../utils/colorTable");

module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    const server = await Server.findOne({
      guildId: oldMember.guild.id,
    }).populate("config");
    try {
      console.log(server)
      // Récupérer la configuration du serveur
      const serverConfig = server.config;
      if (!serverConfig || !serverConfig.logsChannel) {
        console.log("Configuration ou canal de logs non trouvé.");
        return;
      }

      const logChannel = oldMember.guild.channels.cache.get(
        serverConfig.logsChannel
      );
      if (!logChannel) {
        return;
      }

      // Vérifier si le bot a la permission de voir les journaux d'audit
      if (!oldMember.guild.members.me.permissions.has("ViewAuditLog")) {
        console.log("Le bot n'a pas la permission VIEW_AUDIT_LOG.");
        const permissionEmbed = new EmbedBuilder()
          .setTitle("⚠️ Permission manquante")
          .setDescription(
            "Le bot n'a pas la permission `VIEW_AUDIT_LOG` nécessaire pour détecter qui a attribué ou retiré un rôle."
          )
          .setColor(colorTable.warning)
          .setTimestamp();
        return logChannel.send({ embeds: [permissionEmbed] });
      }

      // Vérification des rôles attribués ou supprimés
      const addedRoles = newMember.roles.cache.filter(
        (role) => !oldMember.roles.cache.has(role.id)
      );
      const removedRoles = oldMember.roles.cache.filter(
        (role) => !newMember.roles.cache.has(role.id)
      );

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        // Récupérer les logs d'audit
        const auditLogs = await oldMember.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberRoleUpdate,
        });
        const logEntry = auditLogs.entries.first();

        if (!logEntry) {
          console.log("Aucune entrée trouvée dans les journaux d'audit.");
          return;
        }

        // Identifier l'utilisateur ayant modifié les rôles
        const executor = logEntry.executor;

        const embed = new EmbedBuilder()
          .setTitle("Modification des rôles")
          .setColor(colorTable.info)
          .setAuthor({
            name: newMember.displayName,
            iconURL: newMember.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        if (addedRoles.size > 0) {
          embed.addFields({
            name: "**Rôle(s) ajouté(s)**",
            value: addedRoles.map((role) => `<@&${role.id}>`).join(", "),
            inline: true,
          });
        }

        if (removedRoles.size > 0) {
          embed.addFields({
            name: "**Rôle(s) supprimé(s)**",
            value: removedRoles.map((role) => `<@&${role.id}>`).join(", "),
            inline: true,
          });
        }

        if (executor) {
          embed.setFooter({
            text: `Modifié par: ${executor.displayName}`,
            iconURL: executor.displayAvatarURL(),
          });
        }

        return logChannel.send({ embeds: [embed] });
      }
      if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder()
          .setTitle("🔄 Changement de pseudo")
          .setColor(colorTable.info)
          .addFields(
            {
              name: "Utilisateur",
              value: `${newMember.user.displayName} (${newMember.id})`,
            },
            {
              name: "Ancien pseudo",
              value: oldMember.nickname || "Aucun",
              inline: true,
            },
            {
              name: "Nouveau pseudo",
              value: newMember.nickname || "Aucun",
              inline: true,
            }
          )
          .setFooter({ text: `ID: ${newMember.id}` })
          .setTimestamp();

        // Envoyer l'embed dans le canal de logs
        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Erreur lors du traitement de guildMemberUpdate :", error);
    }
  },
};
