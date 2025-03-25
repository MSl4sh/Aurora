const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Create or delete a role.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new role.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of the role.")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("separate")
            .setDescription("Display role members in a separate group ?")
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Color of the role (hexadecimal, e.g., #ff0000).")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete an existing role.")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Name of the role to delete.")
            .setRequired(true)
        )
    ),

  async execute(interaction, server) {
    const subcommand = interaction.options.getSubcommand();
    const roleName = interaction.options.getString("name");
    const roleToDelete = interaction.options.getRole("role");
    const useTranslate = require("../i18n");
    const { t } = useTranslate(
      server.config.guildLanguage === "en" ? "en" : "fr"
    );
    const logs = interaction.guild.channels.cache.get(
      server.config.moderationLogsChannel
    );

    if (subcommand === "create") {
      const color = interaction.options.getString("color") || "#ffffff";
      const hoist = interaction.options.getBoolean("separate") || false;

      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

      if (!hexRegex.test(color)) {
        return interaction.reply({
          content:
            t("⛔ Le code couleur entré n'est pas valide. Veuillez fournir un code hexadécimal valide, comme #ff0000 ou #fff."),
          ephemeral: true,
        });
      }

      try {
        const role = await interaction.guild.roles.create({
          name: roleName,
          color: color,
          hoist: hoist,
          reason: `${interaction.user.tag} ${t("a créé ce rôle.")}`,
        });

        const embed = new EmbedBuilder()
          .setTitle(t("Création d'un rôle"))
          .setDescription(
            `${t("Le rôle")} **${role}** ${t("a été créé.")} ${
              hoist
                ? t(
                    "Les membres de ce rôle seront affichés dans un groupe séparé."
                  )
                : ""
            }`
          )
          .setColor(role.color)
          .setFooter({
            text: `ID: ${role.id} - ${t("Rôle créé par:")} ${
              interaction.user.displayName
            }`,
          });
          if(!logs) {
            return interaction.reply({
                content: "🚫 Le canal de logs n'a pas été configuré."
                });
                }
                
          if (!hasChannelPermissions(logs)) {
            return interaction.reply({
                content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}',logs),
                ephemeral: true
            });
        }

        logs.send({ embeds: [embed] });

        return interaction.reply({
          content: `${t("Le rôle")} **${role}** ${t("a bien été créé.")} ${
            hoist
              ? t(
                  "Les membres de ce rôle seront affichés dans un groupe séparé."
                )
              : ""
          }`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: t("Une erreur est survenue lors de la création du rôle."),
          ephemeral: true,
        });
      }
    }

    if (subcommand === "delete") {
      const role = interaction.guild.roles.cache.find(
        (r) => r === roleToDelete
      );

      if (!role) {
        return interaction.reply(
          `${t("Aucun rôle")} **${roleToDelete}** ${t("trouvé.")}`
        );
      }

      const memberRolePosition = interaction.member.roles.highest.position;
      const targetRolePosition = role.position;

      if (targetRolePosition >= memberRolePosition) {
        return interaction.reply({
          content: t(
            "Vous ne pouvez pas supprimer un rôle supérieur ou égal à votre rôle le plus élevé."
          ),
          ephemeral: true,
        });
      }

      try {
        await role.delete(`${t("Rôle supprimé par")} ${interaction.user.tag}`);

        const embed = new EmbedBuilder()
          .setTitle(t("Suppression d'un rôle"))
          .setDescription(`${t("Le rôle")} **${role}** ${t("a été supprimé.")}`)
          .setColor(role.color)
          .setFooter({
            text: `ID: ${role.id} - ${t("Rôle supprimé par:")} ${
              interaction.user.displayName
            }`,
          });
          if (!hasChannelPermissions(logs)) {
            return interaction.reply({
                content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
                ephemeral: true
            });
        }

        if(!logs) {
          return interaction.reply({
              content: "🚫 Le canal de logs n'a pas été configuré."
              });
              }

        logs.send({ embeds: [embed] });
        return interaction.reply(
          `${t("Le rôle")} ${t("a bien été supprimé.")}`
        );
      } catch (error) {
        console.error(error);
        return interaction.reply(
          t("Une erreur est survenue lors de la suppression du rôle.")
        );
      }
    }
  },
};
