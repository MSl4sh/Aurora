const { Events, EmbedBuilder } = require("discord.js");
const Server = require("../models/serverSchema");
const User = require("../models/userSchema");
const colorTable = require("../utils/colorTable");

const userXpCooldowns = new Map(); // Map pour gérer les cooldowns d'XP

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    let server = await Server.findOne({ guildId: message.guild.id }).populate(
      "config"
    );
    if (!server || !server.config || !server.config.xpSystem) return;

    const member = message.guild.members.cache.get(message.author.id);

    // Exclure les administrateurs et modérateurs
    if (
      member.permissions.has("Administrator") ||
      member.permissions.has("ModerateMembers")
    ) {
      return;
    }

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Gestion du Cooldown
    const timestamp = Date.now();
    if (userXpCooldowns.has(userId)) {
      const lastTimestamp = userXpCooldowns.get(userId);
      const cooldownPeriod = 10000; // 10 secondes
      if (timestamp - lastTimestamp < cooldownPeriod) {
        return; // Ignorer l'attribution d'XP
      }
    }

    // Calculer le montant d'XP
    let baseXp = Math.floor(Math.random() * 10) + 5;

    // Réduire l'XP pour les utilisateurs avec des warns
    const warns = server.warnings.filter((warn) => warn.userId === userId);
    if (warns.length > 0) {
      const penaltyFactor = 0.7; // 30% de réduction
      baseXp = Math.floor(baseXp * penaltyFactor);
    }

    // Ajouter l'XP
    let user = await User.findOne({ guildId, userId });
    if (!user) {
      user = new User({
        guildId,
        userId,
        xp: 0,
        level: 1,
      });
    }

    // Ajouter de l'XP
    user.xp += baseXp;

    // Calculer l'XP nécessaire pour le prochain niveau
    let nextLevelXP = 5 * user.level ** 2 + 50 * user.level + 100;

    // Vérifier si l'utilisateur dépasse le seuil pour le niveau actuel
    if (user.xp >= nextLevelXP) {
      // Passer au niveau suivant
      user.level += 1;

      // Réinitialiser l'XP pour le nouveau niveau
      user.xp = 1;

      // Récupérer une éventuelle récompense de rôle pour le niveau actuel
      const currentReward = server.config.levelRewards.find(
        (r) => r.level === user.level
      );

      // Supprimer tous les rôles associés aux autres paliers
      server.config.levelRewards.forEach((reward) => {
        const roleToRemove = message.guild.roles.cache.get(reward.roleId);
        if (roleToRemove && member.roles.cache.has(roleToRemove.id)) {
          member.roles
            .remove(roleToRemove)
            .catch((err) =>
              console.error(
                `Erreur lors de la suppression du rôle ${roleToRemove.name} pour ${member.user.tag} :`,
                err
              )
            );
        }
      });

      // Ajouter le rôle du palier actuel (s'il existe)
      if (currentReward) {
        const currentRole = message.guild.roles.cache.get(currentReward.roleId);
        if (currentRole) {
          member.roles
            .add(currentRole)
            .catch((err) =>
              console.error(
                `Erreur lors de l'ajout du rôle ${currentRole.name} pour ${member.user.tag} :`,
                err
              )
            );

          message.channel.send(
            `🎉 Félicitations <@${message.author.id}> ! Vous avez atteint le niveau **${user.level}** ! Vous avez reçu le rôle **${
              currentRole.name
            }** !`
          );
        }
      } else {
        // Si aucun rôle n'est associé au niveau actuel
        message.channel.send(
          `🎉 Félicitations <@${message.author.id}> ! Vous avez atteint le niveau **${user.level}** !`
        );
      }

      // Créer un embed pour les logs
      const embed = new EmbedBuilder()
        .setTitle("Nouveau niveau")
        .setDescription(
          `${message.author.displayName} est passé au niveau **${user.level}** !`
        )
        .setColor(colorTable.success)
        .setTimestamp();

      const logsChannel = message.guild.channels.cache.get(
        server.config.logsChannel
      );
      if (logsChannel) {
        logsChannel.send({ embeds: [embed] });
      }
    }

    // Sauvegarder les changements
    await user.save();

    // Mettre à jour le cooldown
    userXpCooldowns.set(userId, timestamp);
  },
};
