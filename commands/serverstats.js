const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-stats")
    .setDescription("Display server statistics.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, server) {
    const useTranslate = require("../i18n");
    const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

    try {
      // Définir une réponse différée
      await interaction.deferReply();

      const guild = interaction.guild;

      // Récupération des statistiques de base
      const totalMembers = guild.memberCount;
      const totalRoles = guild.roles.cache.size;
      const totalTextChannels = guild.channels.cache.filter(
        (ch) => ch.type === 0
      ).size; // Textuel
      const totalVoiceChannels = guild.channels.cache.filter(
        (ch) => ch.type === 2
      ).size; // Vocal

      // Croissance du serveur (nouveaux membres ajoutés au cours des 30 derniers jours)
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // Timestamp d'il y a 30 jours
      const newMembers = guild.members.cache.filter(
        (member) => member.joinedTimestamp > oneMonthAgo
      ).size;

      // Classement des salons les plus actifs (messages)
      const messagesByChannel = new Map();
      const fetchedChannels = guild.channels.cache.filter((ch) =>
        ch.isTextBased()
      );

      for (const channel of fetchedChannels.values()) {
        const messages = await channel.messages
          .fetch({ limit: 100 })
          .catch(() => null);
        if (messages) messagesByChannel.set(channel.id, messages.size);
      }

      const mostActiveChannels = [...messagesByChannel.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([channelId, count]) => `<#${channelId}>`);

      // Construire l'embed
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${t("Statistiques du serveur")}`)
        .setColor(colorTable.info)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          {
            name: `${t("Membres totaux")}`,
            value: `${totalMembers}`,
            inline: true,
          },
          {
            name: `${t("Rôles totaux")}`,
            value: `${totalRoles}`,
            inline: true,
          },
          { name: `${t("Salons textuels")}`, value: `${totalTextChannels}` },
          { name: `${t("Salons vocaux")}`, value: `${totalVoiceChannels}` },
          { name: `${t("Nouveaux membres (30j)")}`, value: `${newMembers}` },
          {
            name: `${t("Salons les plus actifs")}`,
            value:
              mostActiveChannels.length > 0
                ? mostActiveChannels.join("\n")
                : `${t("Auncune donnée disponible")}`,
            inline: false,
          }
        )
        .setFooter({ text: `${t("Statistiques pour")} ${guild.name}` })
        .setTimestamp();

      // Modifier la réponse différée avec l'embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Erreur lors de la commande /serverstats :", error);
      await interaction.editReply({
        content: `${t(
          "Une erreur est survenue lors de l'exécution de la commande."
        )}`,
      });
    }
  },
};
