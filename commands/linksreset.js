const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-links')
        .setDescription("Delete all usefull links from the server's configuration.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, server) {
        const config = server.config;
        
        try {
            if(!server.config.guildLanguage) {
                return interaction.reply({ content: `❌ La configuration du serveur est introuvable.` , ephemeral: true });
            }
            const useTranslate = require('../i18n');
            const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");;

            config.links = [];
            await config.save();

            await interaction.reply({ content: `✅ ${t("Les liens ont étés réinitialisés")}`, ephemeral: true });

            const logChannel = interaction.guild.channels.cache.find(ch => ch.id === config.logsChannel);

            // Crée un embed avec le GIF
            const embed = new EmbedBuilder()
                .setTitle(`🔗${t("Liens supprimés")}`)
                .setDescription(`✅ ${t("Les liens ont étés réinitialisés")}`)
                .setColor(colorTable.info) // Bleu pour un aspect informatif
            // Envoie l'embed
            await logChannel.send({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error("Erreur lors de l'exécution de la commande links :", error);
            await interaction.reply({ content: `❌ ${t("Une erreur est survenue lors de la réinitialisation des liens.")}`, ephemeral: true });
        }
    },
};
