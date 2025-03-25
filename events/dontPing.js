const { Events, EmbedBuilder } = require("discord.js");
const User = require("../models/userSchema");

module.exports = {
  name: Events.MessageCreate, // Nom de l'événement (correct pour Discord.js v14+)
  async execute(message) {

    if (message.author.bot) return;

    try {
      

      const mentionedUsers = message.mentions.users;


      mentionedUsers.forEach(async (user) => {
        const dontPingUsers = await User.find({
          guildId: message.guild.id,
          userId: user.id,
          dontPing: true,
        });
        const isProtected = dontPingUsers.some(
          (dontPingUser) => dontPingUser.userId === user.id
        );

        if (isProtected && !message.member.permissions.has("ModerateMembers")) {
          await message.delete();
          return message.channel.send({
            content: `⛔ Une ou plusieur personne que vous avez mentionnée est protégée par le système anti mentions. ${
              user.username
            }.`,
            ephemeral: true,
          });
        }
      });
      
    } catch (error) {
      console.error("Erreur dans l'événement messageCreate :", error);
    }
  },
};
