const { EmbedBuilder } = require("discord.js");
const Server = require("../models/serverSchema");
const colorTable = require("../utils/colorTable");


module.exports = {
  name: "messageUpdate",
  async execute(oldMessage, newMessage) {
    // Ignorer les messages des bots ou les messages qui n'ont pas changé
    const server = await Server.findOne({
      guildId: oldMessage.guild.id,
    }).populate("config");
    
    try {
        if (oldMessage.author.bot || oldMessage.content === newMessage.content)
          return;
      // Récupérer la configuration du serveur
      const serverConfig = server.config;

      if (!server.config || !serverConfig.logsChannel) {
        return;
      }

      const logChannel = oldMessage.guild.channels.cache.get(
        serverConfig.logsChannel
      );

      if (!logChannel) {
        // Si le canal des logs n'existe plus ou n'est pas accessible, ignorer
        return;
      }

      // Limiter la longueur des contenus
      const maxLength = 1024;
      const oldContent =
        oldMessage.content.length > maxLength
          ? `${oldMessage.content.slice(0, maxLength - 3)}...`
          : oldMessage.content || "Aucun contenu (peut-être un embed)";
      const newContent =
        newMessage.content.length > maxLength
          ? `${newMessage.content.slice(0, maxLength - 3)}...`
          : newMessage.content || "Aucun contenu (peut-être un embed)";

      // Créer un embed pour les logs
      const embed = new EmbedBuilder()
        .setColor(colorTable.info) // Couleur pour indiquer une modification
        .setTitle(`Message modifié dans le canal ${oldMessage.channel}`)
        .setAuthor({
          name: oldMessage.author.tag,
          iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
        })
        .addFields(
            { name: "Auteur:", value: `<@${oldMessage.author.displayName}>` || "Inconnu", inline: true },
            { name: "Ancien message:", value: oldContent || "Message vide", inline: false },
            { name: "Nouveau message:", value: newContent || "Message vide", inline: false }
          )
        .setTimestamp();

      // Envoyer le log dans le canal configuré
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        "Erreur lors du suivi des modifications des messages :",
        error
      );
    }
  },
};
