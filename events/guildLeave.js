const { Events } = require("discord.js");
const Server = require("../models/serverSchema");
const ServerConfig = require("../models/serverConfig");
const Automod = require("../models/autoModSchema");
const User = require("../models/userSchema");

module.exports = {
  name: Events.GuildDelete,
  once: false,
  async execute(guild) {
    try {
      if (!guild) {
        console.warn("⚠️ L'événement guildDelete a été déclenché sans informations sur la guild.");
        return;
      }
      const server = await Server.findOne({ guildId: guild.id }).populate("config");

      console.log(`📤 Le bot a quitté le serveur : ${guild.name} (${guild.id}).`);

      // Supprimer les données associées à la guild de la base de données
      const serverDeleted = await Server.findOneAndDelete({ guildId: guild.id });
      const configDeleted = await ServerConfig.findOneAndDelete({ _id: server.config._id });
      const autoModDeleted = await Automod.findOneAndDelete({ guildId: guild.id });
      const usersDeleted = await User.deleteMany({ guildId: guild.id });

      if (serverDeleted || configDeleted || autoModDeleted || usersDeleted) {
        console.log(`✅ Les données du serveur ${guild.name} (${guild.id}) ont été supprimées.`);
      } else {
        console.warn(`⚠️ Aucun enregistrement trouvé pour le serveur ${guild.name} (${guild.id}).`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des données pour la guild ${guild.id}:`, error);
    }
  },
};
