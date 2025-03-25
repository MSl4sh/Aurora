const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-permissions")
    .setDescription("Check the permissions of a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check the permissions.")
        .setRequired(true)
    ),
  async execute(interaction, server) {
    const targetUser = interaction.options.getUser("user");
    const guild = interaction.guild;
    const serverConfig = server.config;
    
    // Vérification que la cible n'est pas un bot
    
    try {
        if(!server.config.guildLanguage) {
            return interaction.reply({
                content: `❌ "Aucune donnée trouvée pour ce serveur.`,
                ephemeral: true,
            });
        }
        const useTranslate = require("../i18n");
        const { t } = useTranslate(serverConfig.guildLanguage);

      // Récupération des informations du membre ciblé
      if (targetUser.bot) {
        return interaction.reply({
          content: `❌ ${t(
            "Vous ne pouvez pas vérifier les permissions d'un bot."
          )}`,
          ephemeral: true,
        });
      }
      const member = await guild.members.fetch(targetUser.id);

      // Récupérer les permissions globales
      const globalPermissions = member.permissions.toArray();

      // Vérifier les restrictions sur les canaux
      const restrictedChannels = [];
      guild.channels.cache.forEach((channel) => {
        const permissions = channel.permissionsFor(member);
        if (permissions && !permissions.has(PermissionFlagsBits.SendMessages)) {
          restrictedChannels.push(channel.name);
        }
      });

      // Construire l'embed
      const embed = new EmbedBuilder()
        .setColor(colorTable.info)
        .setTitle(`${t("Permissions de")} ${targetUser.username}`)
        .setDescription(
          `${t("Voici les permissions de")} ${targetUser.username} ${t(
            "sur le serveur."
          )}`
        )
        .addFields(
          {
            name: `${t("Permissions globales")}`,
            value:
              globalPermissions.length > 0
                ? globalPermissions.map((perm) => `- ${perm}`).join("\n")
                : `${t("Aucune permission détectée.")}`,
          },
          {
            name: `${t("Permissions restreintes")}`,
            value:
              restrictedChannels.length > 0
                ? restrictedChannels.join(", ")
                : `${t("Aucun canal restreint.")}`,
          }
        )
        .setFooter({
          text: `${t("Demandé par")} ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Répondre avec l'embed
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la commande /checkpermissions :",
        error
      );
      await interaction.reply({
        content: `❌ ${t(
          "Une erreur s'est produite lors de l'exécution de la commande."
        )}`,
        ephemeral: true,
      });
    }
  },
};
