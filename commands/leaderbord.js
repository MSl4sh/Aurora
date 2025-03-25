const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/userSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display the top 10 users in the server based on their level.'),
    async execute(interaction, server) {
        const guildId = interaction.guild.id;
        const config = server.config;
        if (!config.xpSystem) {
            return interaction.reply({
                content: '❌ The XP system is not enabled.',
                ephemeral: true,
            });
        }

        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');

        // Récupérer les 10 premiers utilisateurs triés par niveau et XP
        const topUsers = await User.find({ guildId })
            .sort({ level: -1, xp: -1 }) // Tri décroissant par niveau, puis par XP
            .limit(10);

        if (!topUsers.length) {
            return interaction.reply({
                content: t("❌ Aucuns utilisateurs n'ont été trouvés."),
                ephemeral: true,
            });
        }

        // Générer le contenu du leaderboard
        const leaderboard = topUsers
            .map((user, index) => {
                const rank = `**#${index + 1}**`;
                const username = `<@${user.userId}>`; // Mentionner l'utilisateur
                const level = `${t("Niveau")} : ${user.level}`;
                const xp = `XP : ${user.xp}`;
                return `${rank} - ${username}\n${level}\n${xp}`;
            })
            .join('\n\n');

        // Créer l'embed pour afficher le leaderboard
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Or pour le classement
            .setTitle(t("🏆 Leaderboard"))
            .setDescription(`${t("Voici les 10 membres les mieux classés dans ce serveur")} :\n\n${leaderboard}`)
            .setFooter({ text: `${t("Commande exécutée par")} ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
