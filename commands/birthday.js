const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription("Check upcoming birthdays.")
        .addUserOption(option =>
            option.setName('user').setDescription('Utilisateur cible.')
        ),
    async execute(interaction, server) {
        const user = interaction.options.getUser('user');
        const serverConfig = server.config;

        try {
            if (!server.config.guildLanguage) {
                return interaction.reply({
                    content: `❌ La configuration du serveur est introuvable.`,
                    ephemeral: true,
                });
            }

            const useTranslate = require('../i18n');
            const { t } = useTranslate(serverConfig.guildLanguage);

            // Vérifier l'anniversaire d'un utilisateur spécifique
            if (user) {
                const userBirthday = serverConfig.birthdays.find(b => b.userId === user.id);

                if (!userBirthday) {
                    return interaction.reply({
                        content: `❌ ${t("Cet utilisateur n'a pas défini de date d'anniversaire.")}`,
                        ephemeral: true,
                    });
                }

                const now = new Date();
                const birthday = new Date(userBirthday.birthday);
                const formattedDate = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())
                    .toLocaleDateString('fr-FR');

                const embed = new EmbedBuilder()
                    .setColor(colorTable.neutral)
                    .setTitle(`🎉 ${t("Anniversaire de")} ${user.displayName}`)
                    .setDescription(`${t("Cet utilisateur fêtera son anniversaire le")} **${formattedDate}**`)
                    .setFooter({ text: t("Commande exécutée par") + ` ${interaction.user.username}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // Anniversaires à venir dans l'année en cours
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentDay = now.getDate();

            const upcomingBirthdays = serverConfig.birthdays
                .filter(b => {
                    const birthday = new Date(b.birthday);
                    const birthdayMonth = birthday.getMonth();
                    const birthdayDay = birthday.getDate();

                    return (
                        birthdayMonth > currentMonth ||
                        (birthdayMonth === currentMonth && birthdayDay >= currentDay)
                    );
                })
                .sort((a, b) => {
                    const dateA = new Date(a.birthday);
                    const dateB = new Date(b.birthday);
                    return dateA - dateB; // Tri par date croissante
                });

            if (upcomingBirthdays.length === 0) {
                return interaction.reply({
                    content: `🎂 ${t("Aucun anniversaire à venir cette année.")}`,
                    ephemeral: true,
                });
            }

            const birthdayList = upcomingBirthdays
                .map(b => {
                    const birthday = new Date(b.birthday);
                    const formattedDate = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())
                        .toLocaleDateString('fr-FR');
                    return `<@${b.userId}> : ${formattedDate}`;
                })
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(colorTable.neutral)
                .setTitle(`🎉 ${t("Anniversaires à venir")}`)
                .setDescription(birthdayList)
                .setFooter({ text: t("Commande exécutée par") + ` ${interaction.user.displayName}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: `❌ ${t("Une erreur s'est produite lors de l'exécution de la commande.")}`,
                ephemeral: true,
            });
        }
    },
};
