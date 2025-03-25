const { EmbedBuilder } = require("discord.js");
const Server = require("../models/serverSchema");
const colorTable = require("../utils/colorTable");

const welcomeMessages = [
  "Bienvenue ${member}! Nous sommes ravis de t'accueillir sur le serveur. 🎉 N'hésite pas à te présenter !",
  "Salut ${member} ! Heureux de te voir ici ! Passe un bon moment parmi nous. 😊",
  "Hey ${member} ! Bienvenue dans notre communauté ! Fais comme chez toi. 😄",
  "Coucou ${member} ! Content que tu nous aies rejoints. 💬 Rejoins-nous vite dans la discussion !",
  "Bienvenue ${member} ! Prêt pour une belle aventure avec nous ? 🚀",
  "Un nouveau membre est là ! Accueillons chaleureusement ${member} ! 🥳",
  "Hé ${member}, bienvenue sur notre serveur ! Ton aventure commence ici. 🌟",
  "Bonjour ${member} ! Ravie de te compter parmi nous. Rejoins vite les discussions ! 💡",
  "Wow, regarde qui est là ! ${member}, sois le/la bienvenu(e) ! 🎊",
  "Bienvenue ${member} ! Nous sommes là pour t'aider si tu as des questions. 🛠️",
];

module.exports = {
  name: "guildMemberAdd", // Nom de l'événement
  async execute(member) {
    const guild = member.guild;
    let server = await Server.findOne({ guildId: guild.id }).populate("config");
    const config = server.config;

    if(!server.config.welcomeChannel) {
      return interaction.reply({
        content: `❌ La configuration du serveur est introuvable.`,
        ephemeral: true,
      });
    }

    // Vérifie le canal de bienvenue
    const welcomeChannel = guild.channels.cache.get(config.welcomeChannel);
    if (welcomeChannel) {
      try {
        if (config.welcomeMessage) {
          await welcomeChannel.send(
            config.welcomeMessage.replace("@user", member)
          );
        } else {
          const randomMessage =
            welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
          await welcomeChannel.send(randomMessage.replace("${member}", member));
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'envoi du message de bienvenue : ${error}`
        );
      }
    } else {
      console.log(`Canal '${welcomeChannel}' introuvable.`);
    }

    // Vérifie le rôle
    const newMemberRole = guild.roles.cache.find(
      (role) => role.id === config.newMemberRole
    );
    if (newMemberRole) {
      try {
        await member.roles.add(newMemberRole);
      } catch (error) {
        console.error(`Erreur lors de l'attribution du rôle : ${error}`);
      }
    }

    const logsChannel = guild.channels.cache.get(config.logsChannel);
    if (logsChannel) {
      try {
        if(!server.config.welcomeChannel) {
          return interaction.reply({
            content: `❌ La configuration du serveur est introuvable.`,
            ephemeral: true,
          });
        }
        const embed = new EmbedBuilder()
          .setColor(colorTable.success)
          .setAuthor({
            name: member.user.displayName,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `a rejoint le serveur ${
              newMemberRole
                ? "et a reçu le rôle " + newMemberRole.name
                : "mais n'a pas reçu le rôle "
            }`
          )
          .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error(`Erreur lors de l'envoi du message de logs : ${error}`);
      }
    }

    // Vérification des nouveaux comptes si activée
    if (config.accountCheckEnabled) {
      const createdAt = member.user.createdAt;
      const now = new Date();
      const timeDiff = now - createdAt;
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

      if (timeDiff < twoDaysInMs) {
        const logsChannel = guild.channels.cache.get(config.logsChannel);
        if (!logsChannel) {
          console.log(`Canal '${logsChannelName}' introuvable.`);
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(colorTable.warning) // Couleur orange pour avertissement
          .setTitle("⚠️ Nouveau compte récent détecté")
          .setDescription(
            `Un compte récent a rejoint le serveur : ${member.user.displayName}`
          )
          .addFields(
            {
              name: "Créé le",
              value: `<t:${Math.floor(createdAt / 1000)}:F>`,
            },
            { name: "Utilisateur", value: `${member.user}`, inline: true },
            { name: "ID", value: `${member.user.id}`, inline: true }
          )
          .setTimestamp();

        try {
          await logsChannel.send({ embeds: [embed] });
          console.log(
            `Alerte envoyée pour le compte récent : ${member.user.tag}`
          );
        } catch (error) {
          console.error(
            `Erreur lors de l'envoi de l'alerte pour le compte récent : ${error}`
          );
        }
      }
    }
  },
};
