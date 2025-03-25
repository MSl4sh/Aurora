const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable")
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement to the announcements channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) 
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send in the announcement.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the announcement.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("The color of the announcement embed.")
        .addChoices(
          { name: "Red", value: "RED" },
          { name: "Green", value: "GREEN" },
          { name: "yellow", value: "WARNING" }
        )
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the announcement in.")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("ping")
        .setDescription("Role to ping in the announcement.")
        .setRequired(false)
    ),
  async execute(interaction, server) {
    const guild = interaction.guild;
    
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: `❌ ${t("Je n'ai pas la permission de gérer les messages. Veuillez vérifier mes permissions.")}`,
        ephemeral: true,
      });
    }
    
    // Récupère les options
    const messageContent = interaction.options.getString("message");
    const title = interaction.options.getString("title");
    const color = interaction.options.getString("color") || "BLUE"; // Couleur par défaut
    const roleToPing = interaction.options.getRole("ping");
    const channel = interaction.options.getChannel("channel");
    
    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ La configuration du serveur est introuvable.`,
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const {t} = useTranslate(server.config.guildLanguage);
      // Map des couleurs
      const colorMap = {
        RED: colorTable.danger,
        GREEN: colorTable.success,
        WARNING: colorTable.warning,
        BLUE: colorTable.info, // Valeur par défaut
      };

      // Crée un embed pour l'annonce
      const embed = new EmbedBuilder()
        .setDescription(messageContent)
        .setColor(colorMap[color]) // Utilise la couleur mapée
        .setTimestamp();

      if (title) {
        embed.setTitle(title);
      }

      // Envoie l'annonce dans le canal actuel
      let announcementChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === server.config.announcementsChannel
      );

      
      // Prépare le message à envoyer
      let content = "";
      if (roleToPing) {
        content = `${roleToPing}`;
      }
      if (channel) {
        announcementChannel = interaction.guild.channels.cache.find(c=>c === channel);  
      }
      
      if (!announcementChannel) {
        return interaction.reply({
          content: `❌ ${t("Impossible de trouver le canal pour l'annonce.")}`,
          ephemeral: true,
        });
      }

      if (!hasChannelPermissions(announcementChannel)) {
        return interaction.reply({
            content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}',announcementChannel),
            ephemeral: true
        });
    }
      // Envoie le message
      await announcementChannel.send({
        content: content,
        embeds: [embed],
      });

      // Confirmation de succès
      await interaction.reply({
        content: `✅ ${t("Annonce envoyée avec succès !")}`,
        ephemeral: true,
      });

      // Logs dans le canal des logs
      const logsChannel = interaction.guild.channels.cache.find(
        (channel) => channel.id === server.config.logsChannel
      );
      if (!hasChannelPermissions(logsChannel)) {
        return interaction.reply({
            content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
            ephemeral: true
        });
    }
      if (logsChannel) {
        if (!hasChannelPermissions(logsChannel)) {
          return interaction.reply({
              content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}',logsChannel),
              ephemeral: true
          });
      }
        const logEmbed = new EmbedBuilder()
          .setTitle(`📢 ${t("Annonce")}`)
          .setDescription(
            `${t("Une annonce a été envoyée dans le canal")} ${announcementChannel}.`
          )
          .addFields(
            { name: `${t("Titre")}`, value: title || `${t("Aucun")}`},
            { name: `${t("Contenu")}`, value: messageContent },
            {
              name: `${t("Ping")}`,
              value: roleToPing ? roleToPing.name : `${t("Aucun")}`,
              inline: true,
            },
          )
          .setColor(colorMap[color])
          .setFooter({text: `${t("Annonce envoyée par")} ${interaction.user.displayName}`})
          .setTimestamp();

        logsChannel.send({ embeds: [logEmbed] });

      }
    } catch (error) {
      console.error("Erreur lors de l'annonce :", error);
      interaction.reply({
        content: `❌ ${t("Une erreur est survenue lors de l'envoi de l'annonce.")}`,
        ephemeral: true,
      });
    }
  },
};
