const Server = require("../models/serverSchema");

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
     const guild = reaction.message.guild;
        let server = await Server.findOne({ guildId: guild.id }).populate("config");
        const config = server.config;
        if (config.reactionRoles.length === 0) return;
        
        if (!config) {
            return interaction.reply({
              content: `❌ La configuration du serveur est introuvable.`,
              ephemeral: true,
            });
          }
        try {
            if (user.bot) return; // Ignore les bots
      
      
            // Vérification de la configuration pour ce message et cet emoji
            const configEntry = config.reactionRoles.find(
              (c) =>
                c.messageId === reaction.message.id && c.emoji === reaction.emoji.name
            );
      
            if (!configEntry) return;
      
            // Récupération du membre
            const member = await reaction.message.guild.members.fetch(user.id);
            if (!member) {
              console.error(`Impossible de récupérer le membre : ${user.tag}`);
              return;
            }
      
            // ajout du rôle
            const role = reaction.message.guild.roles.cache.get(configEntry.roleId);
            if (!role) {
              console.error(`Rôle introuvable : ${configEntry.roleId}`);
              return;
            }
      
            await member.roles.add(role);
            
          } catch (error) {
            console.error("Erreur dans messageReactionRemove :", error);
          }
  },
};
