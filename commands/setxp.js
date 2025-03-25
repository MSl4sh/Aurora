const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../models/userSchema');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setxp')
        .setDescription("set the XP of a user.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Target user.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('xp')
                .setDescription('New XP value.')
                .setRequired(true)),
    async execute(interaction, server) {
        const target = interaction.options.getUser('user');
        const xp = interaction.options.getInteger('xp');
        const guildId = interaction.guild.id;
        const config = server.config;
        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage==='en'?'en':'');
        if(!config.xpSystem) {
            return interaction.reply({
                content: t("❌ Le système d'XP n'est pas activé."),
                ephemeral: true,
            });
        }

        if(xp < 0) {
            return interaction.reply({
                content: t("❌ L'XP doit être supérieure ou égale à 0."),
                ephemeral: true,
            });
        }

        let user = await User.findOne({ guildId, userId: target.id });
        if (!user) {
            user = new User({ guildId, userId: target.id, xp: 0, level: 1 });
        }

        user.xp = xp;

        // Recalcul du niveau
        const nextLevelXP = (level) => 5 * (level ** 2) + 50 * level + 100;
        while (user.xp >= nextLevelXP(user.level)) {
            user.level += 1;
        }

        await user.save();

        const embed = new EmbedBuilder()
            .setTitle(t("XP défini"))
            .setDescription(t(`${t("L'XP de")} ${target.displayName} ${t("a été défini à")} ${xp} XP.`))
            .setColor(colorTable.success)
            .setFooter({text:t("Commande exécutée par") + ` ${interaction.user.username}`})
            .setTimestamp();

        await interaction.guild.channels.cache.get(config.moderationLogsChannel).send({ embeds: [embed], ephemeral: false });

        return interaction.reply({
            content: `${t("L'XP de")} **${target.username}** ${t("a été défini à")} **${xp} XP**.`,
            ephemeral: true,
        });
    },
};
