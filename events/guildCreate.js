const { Events } = require("discord.js");
const Server = require("../models/serverSchema");
const ServerConfig = require("../models/serverConfig");
const Automod = require("../models/autoModSchema");
const User = require("../models/userSchema");
const defaultLanguage = "en"

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    try {
      console.log(`📥 Le bot a rejoint un nouveau serveur : ${guild.name} (${guild.id})`);

      // Vérifiez si le serveur existe déjà
      const existingServer = await Server.findOne({ guildId: guild.id });
      const existingConfig = await ServerConfig.findOne({ guild: guild.id });
      const existingAutoMod = await Automod.findOne({ guildId: guild.id });
      const existingUsers = await User.find({ guildId: guild.id });
      const preferedLanguage = guild.preferredLocale.split("-")[0];
      console.log(preferedLanguage);

      if (existingServer) {
        console.log(`⚠️ Une configuration existante a été trouvée pour ${guild.name}. Elle sera remplacée.`);
        await Server.deleteOne({ guildId: guild.id });
        await ServerConfig.deleteOne({ guildId: guild.id });
      }

      if (existingConfig) {
        console.log(`⚠️ Une configuration existante a été trouvée pour ${guild.name}. Elle sera remplacée.`);
        await ServerConfig.deleteOne({ guild: guild.id });
      }

      if (existingAutoMod) {
        console.log(`⚠️ Une configuration existante a été trouvée pour ${guild.name}. Elle sera remplacée.`);
        await Automod.deleteOne({ guildId: guild.id });
      }

      if (existingUsers) {
        console.log(`⚠️ Des utilisateurs existants ont été trouvés pour ${guild.name}. Ils seront supprimés.`);
        await User.deleteMany({ guildId: guild.id });
      }


      const newConfig = new ServerConfig({
      });
      newConfig.guild= guild.id;
      newConfig.guildLanguage = preferedLanguage? preferedLanguage : defaultLanguage;
      const savedConfig = await newConfig.save();

      const newAutoMod = new Automod({
        guildId: guild.id,
      });

      await newAutoMod.save();

      // Créez une nouvelle configuration
      const newServer = new Server({
        guildId: guild.id,
        guildName: guild.name,
        config: savedConfig._id,
        warnings: [], // Initialisez un tableau vide pour warnings
        joinDate: new Date(),
      });


      console.log(newServer);  

      await newServer.save();
      console.log(`✅ Nouvelle configuration créée pour ${guild.name} (${guild.id}).`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du serveur ${guild.name} (${guild.id}) :`, error);
    }
  },
};
