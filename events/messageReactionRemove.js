const Server = require("../models/serverSchema");

module.exports = {
  name: "messageReactionRemove",
  async execute(reaction, user) {
    const guild = reaction.message.guild;
    let server = await Server.findOne({ guildId: guild.id }).populate("config");
    const config = server.config;
    try {
      if (user.bot) return; // Ignore les bots

      const guildConfig = config.reactionRoles;

      if (!guildConfig) return;

      // Vérification de la configuration pour ce message et cet emoji
      const configEntry = guildConfig.find(
        (c) =>
          c.messageId === reaction.message.id && c.emoji === reaction.emoji.name
      );

      if (!configEntry) return;

      // Récupération du membre
      const member = await reaction.message.guild.members.fetch(user.id);
      if (!member) {
        console.error(`Impossible de récupérer le membre : <@${user.tag}>`);
        return;
      }

      // Retrait du rôle
      const role = reaction.message.guild.roles.cache.get(configEntry.roleId);
      if (!role) {
        console.error(`Rôle introuvable : ${configEntry.roleId}`);
        return;
      }

      await member.roles.remove(role);
      console.log(`Rôle ${role.name} retiré de <@${member.user.tag}>`);
    } catch (error) {
      console.error("Erreur dans messageReactionRemove :", error);
    }
  },
};
