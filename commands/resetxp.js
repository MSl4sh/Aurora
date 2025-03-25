const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../models/userSchema');
const colorTable = require('../utils/colorTable');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetxp')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDescription("Reset all XP data and remove associated roles."),
    async execute(interaction, server) {
        const guildId = interaction.guild.id;
        const config = server.config;

        if (!config.xpSystem) {
            return interaction.reply({
                content: '❌ Le système d\'XP n\'est pas activé.',
                ephemeral: true,
            });
        }

        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');

        try {
            // Récupérer les utilisateurs dans la table User liés au serveur
            const users = await User.find({ guildId });

            // Boucler sur chaque utilisateur trouvé pour gérer les rôles
            for (const user of users) {
                const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                if (member) {
                    // Retirer les rôles associés aux récompenses d'XP
                    server.config.levelRewards.forEach(reward => {
                        const role = interaction.guild.roles.cache.get(reward.roleId);
                        if (role && member.roles.cache.has(role.id)) {
                            member.roles.remove(role).catch(err =>
                                console.error(`Erreur lors de la suppression du rôle ${role.name} pour ${member.user.tag} :`, err)
                            );
                        }
                    });
                }
            }

            // Supprimer toutes les données XP des utilisateurs du serveur
            await User.deleteMany({ guildId });

            // Log de l'action dans le canal des logs
            const embed = new EmbedBuilder()
                .setTitle(t("Réinitialisation de l'XP"))
                .setDescription(t("Toutes les données d'XP ont été réinitialisées, et les rôles associés ont été retirés."))
                .setColor(colorTable.success)
                .setTimestamp();

            const logsChannel = interaction.guild.channels.cache.get(config.logsChannel);
            if (logsChannel) {
                await logsChannel.send({ embeds: [embed] });
            }

            // Réponse à l'utilisateur
            return interaction.reply({
                content: t("Toutes les données d'XP ont été réinitialisées, et les rôles associés ont été retirés."),
                ephemeral: true,
            });
        } catch (error) {
            console.error('Erreur lors de la réinitialisation de l\'XP :', error);
            return interaction.reply({
                content: '❌ Une erreur est survenue lors de la réinitialisation de l\'XP.',
                ephemeral: true,
            });
        }
    },
};

