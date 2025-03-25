const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const User = require("../models/userSchema");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xp-manage")
    .setDescription("Add or remove XP from a user.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add XP to a user.")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Target user.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of XP to add.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove XP from a user.")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Target user.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of XP to remove.")
            .setRequired(true)
        )
    ),
  async execute(interaction, server) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("target");
    const amount = interaction.options.getInteger("amount");
    const guildId = interaction.guild.id;
    const config = server.config;
    const useTranslate = require("../i18n");
    const { t } = useTranslate(config.guildLanguage === "en" ? "en" : "");

    if (!config.xpSystem) {
      return interaction.reply({
        content: t("❌ Le système d'XP n'est pas activé."),
        ephemeral: true,
      });
    }

    if (amount <= 0) {
      return interaction.reply({
        content: t("⛔ Le montant doit être un nombre positif."),
        ephemeral: true,
      });
    }

    // Récupérer l'utilisateur dans la base de données
    let user = await User.findOne({ guildId, userId: target.id });

    if (!user && subcommand === "remove") {
      return interaction.reply({
        content: `❌ ${t("L'utilisateur")} ${target.username} ${t(
          "n'a pas encore d'XP enregistré."
        )}`,
        ephemeral: true,
      });
    }

    if (!user && subcommand === "add") {
      user = new User({
        guildId,
        userId: target.id,
        xp: 0,
        level: 1,
      });
    }

    if (subcommand === "add") {
      user.xp += amount;
      while (user.xp >= 5 * user.level ** 2 + 50 * user.level + 100) {
        user.xp -= 5 * user.level ** 2 + 50 * user.level + 100;
        user.level += 1;

        const reward = config.levelRewards.find((r) => r.level === user.level);
        if (reward) {
          const role = interaction.guild.roles.cache.get(reward.roleId);
          if (role) {
            await interaction.guild.members.cache.get(target.id).roles.add(role);
          }

          const embed = new EmbedBuilder()
            .setColor(colorTable.success)
            .setTitle(t("Nouveau niveau atteint"))
            .setDescription(
              `${target.username} ${t("a atteint le niveau")} ${user.level}! ${t(
                "Il a reçu le rôle"
              )} ${role.name}.`
            )
            .setFooter({
              text: t("Ajouté par") + ` ${interaction.user.displayName}`,
            })
            .setTimestamp();

          await interaction.guild.channels.cache
            .get(config.logsChannel)
            .send({ embeds: [embed] });
        }else{
          const embed = new EmbedBuilder()
            .setColor(colorTable.success)
            .setTitle(t("Nouveau niveau atteint"))
            .setDescription(
              `${target.username} ${t("a atteint le niveau")} ${user.level}!`
            )
            .setFooter({
              text: t("Ajouté par") + ` ${interaction.user.displayName}`,
            })
            .setTimestamp();

          await interaction.guild.channels.cache
            .get(config.logsChannel)
            .send({ embeds: [embed] });
        }
      }

      await user.save();
      return interaction.reply({
        content: `✅ ${amount} ${t("XP ont été ajoutés à")} ${target.username}.`,
        ephemeral: false,
      });
    }

    if (subcommand === "remove") {
      user.xp -= amount;

      while (user.xp < 0 && user.level > 1) {
        user.level -= 1;
        user.xp += 5 * user.level ** 2 + 50 * user.level + 100;

        const rewardsToRemove = config.levelRewards.filter(
          (r) => r.level > user.level
        );
        for (const reward of rewardsToRemove) {
          const role = interaction.guild.roles.cache.get(reward.roleId);
          if (role) {
            await interaction.guild.members.cache
              .get(target.id)
              .roles.remove(role);
          }
        }
      }

      if (user.level <= 1 && user.xp < 1) {
        await User.deleteOne({ guildId, userId: target.id });
        return interaction.reply({
          content: `🗑️ ${t("L'utilisateur")} ${target.username} ${t(
            "a été supprimé de la base de données car son niveau est tombé à 1."
          )}`,
          ephemeral: false,
        });
      }

      await user.save();
      return interaction.reply({
        content: `✅ ${amount} ${t("XP ont été retirés à")} ${target.username}.`,
        ephemeral: false,
      });
    }
  },
};
