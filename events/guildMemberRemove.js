const { Events, EmbedBuilder } = require("discord.js");
const Server = require("../models/serverSchema"); // Import du modèle de serveur
const colorTable = require("../utils/colorTable"); // Import du tableau de couleurs

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const server = await Server.findOne({ guildId: member.guild.id }).populate(
      "config"
    );
    try {
      // Récupérer la configuration du serveur
      const serverConfig = server.config;

      // Vérifier si un canal de logs est configuré
      if (!serverConfig || !serverConfig.logsChannel) {
        console.log("Aucun canal de logs configuré pour ce serveur.");
        return;
      }

      // Récupérer le canal de logs
      const logChannel = member.guild.channels.cache.get(
        serverConfig.logsChannel
      );
      if (!logChannel) {
        console.log(
          "Le canal de logs configuré est introuvable ou inaccessible."
        );
        return;
      }

      // Créer un embed pour le log
      const embed = new EmbedBuilder()
        .setColor(colorTable.danger) // Rouge pour quitter
        .setAuthor({
          name: member.user.displayName,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription("a quitté le serveur")
        .setTimestamp();

      // Envoyer l'embed dans le canal de logs
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de l'événement guildMemberRemove :",
        error
      );
    }
  },
};
