const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colorTable = require("../utils/colorTable")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Display your avatar or the avatar of a user.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription("The user to display the avatar.")
                .setRequired(false)
        ),
    async execute(interaction, server) {
        const config = server.config

        try {
            const useTranslate = require('../i18n');
            const { t } = useTranslate(config.guildLanguage);;
            // Récupérer l'utilisateur mentionné ou l'utilisateur qui a exécuté la commande
            const user = interaction.options.getUser('user') || interaction.user;

            // Construire l'URL de l'avatar
            const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

            // Créer l'embed pour afficher l'avatar
            const avatarEmbed = new EmbedBuilder()
                .setColor(colorTable.neutral)
                .setTitle(`${t("Avatar de")} ${user.displayName}`)
                .setImage(avatarUrl)
                .setFooter({ text: `${t("Demandé par")}: ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Répondre avec l'embed
            await interaction.reply({ embeds: [avatarEmbed] });
        } catch (error) {
            console.error('Erreur dans la commande /avatar :', error);
            await interaction.reply({ content: `${t("Une erreur s'est produite lors de l'exécution de la commande.")}` , ephemeral: true });
        }
    },
};
