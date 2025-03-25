const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display information about a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "L'utilisateur dont vous voulez afficher les informations."
        )
        .setRequired(false)
    ),
  async execute(interaction, server) {

    const userOption =
      interaction.options.getUser("user") || interaction.user;

    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: "❌ Aucune donnée trouvée pour ce serveur.",
          ephemeral: true,
        });
      }
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      // Fetch l'utilisateur et son membre associé dans la guilde
      const user = await interaction.client.users.fetch(userOption.id);
      const member = await interaction.guild.members.fetch(user.id);

      // Gestion du statut
      let presenceStatus = t("⚫ Hors ligne");
      if (member.presence && member.presence.status) {
        switch (member.presence.status) {
          case "online":
            presenceStatus = t("🟢 En ligne");
            break;
          case "idle":
            presenceStatus = t("🟠 Inactif");
            break;
          case "dnd":
            presenceStatus = t("🔴 Ne pas déranger");
            break;
          default:
            presenceStatus = t("⚫ Hors ligne");
            break;
        }
      }

      // Création de l'embed
      const embed = new EmbedBuilder()
        .setColor(colorTable.info)
        .setDescription(`**${t("Informations sur ")} ${userOption}**`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: t("Nom d'utilisateur"),
            value: `${userOption}`,
            inline: true,
          },
          { name: t("Statut"), value: presenceStatus, inline: true },
          { name: t("ID utilisateur"), value: user.id, },
          {
            name: t("Rôles"),
            value:
              member.roles.cache.map((role) => role.name).join(", ") ||
              t("Aucun rôle"),
            inline: false,
          },
          {
            name: t("Date de création du compte"),
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`
          },
          {
            name: t("Date d'arrivée sur le serveur"),
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
          }
        )
        .setFooter({
          text: `${t("Demandé par")} ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la commande userinfo :",
        error
      );
      await interaction.reply({
        content: t(
          "❌ Une erreur est survenue lors de l'exécution de la commande."
        ),
        ephemeral: true,
      });
    }
  },
};
