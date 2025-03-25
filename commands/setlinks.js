const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-links')
        .setDescription("Set a link to be displayed in the links list.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the link.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL of the link.')
                .setRequired(true)),
    async execute(interaction, server) {
        const config = server.config;
        const name = interaction.options.getString('name');
        const url = interaction.options.getString('url');

        try {

            const useTranslate = require('../i18n');
            const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

            if (!config.links) {
                config.links = [];
            }

            function isValidURL(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }

            if (!isValidURL(url)) {
                return interaction.reply({ content: t("❌ L'URL fournie n'est pas valide."), ephemeral: true });
            }

            config.links.push({ name, url });
            await config.save();

            await interaction.reply({ content: `${t("✅ Le lien **")}${name}${t("** a été ajouté avec succès.")}`, ephemeral: true });

            const logChannel = interaction.guild.channels.cache.find(ch => ch.id === config.logsChannel);

            // Crée un embed avec le GIF
            const embed = new EmbedBuilder()
                .setTitle(t("🔗 Liens ajouté"))
                .setDescription(`${t("✅ Le lien **")}${name}${t("** a été ajouté à la liste des liens utiles.")}`)
                .setColor(colorTable.info) // Bleu pour un aspect informatif
            // Envoie l'embed
            await logChannel.send({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error("Erreur lors de l'exécution de la commande links :", error);
            await interaction.reply({ content: t("❌ Une erreur est survenue lors de l'envoi des liens"), ephemeral: true });
        }
    },
};
