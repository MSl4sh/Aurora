const { SlashCommandBuilder, EmbedBuilder,PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status')
        .setDescription('Perform a diagnostic of the bot and report any issues.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, server) {
        const guild = interaction.guild;
        const config = server.config;
        const bot = interaction.client;
        
        try {
            
            
            if(!server.config.guildLanguage) {
                return interaction.reply({
                    content: `❌ Aucune donnée trouvée pour ce serveur.`,
                    ephemeral: true,
                });
            }
            
            const useTranslate = require('../i18n');
            const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");;

            await interaction.deferReply({ ephemeral: true });

            // 1. Vérification des permissions du bot
            const botMember = guild.members.me;
            const requiredPermissions = ['ManageRoles', 'ManageChannels', 'SendMessages', 'EmbedLinks', 'ViewChannel', 'ReadMessageHistory', 'UseExternalEmojis', 'AddReactions', 'ManageMessages','ViewAuditLog'];
            const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));

            const permissionStatus = missingPermissions.length > 0
                ? `❌ ${t("Permissions manquantes")} : ${missingPermissions.join(', ')}.`
                : `✅ ${t("Toutes les permissions requises sont accordées.")}`;

            // 2. Vérification de la connexion WebSocket
            const isWebSocketConnected = bot.ws.status === 0
                ?  `✅ ${t("Connexion WebSocket stable.")}`
                : `❌ ${t("Problème de connexion WebSocket. État :")} ${bot.ws.status}.`;

            // 3. Vérification des canaux critiques (par exemple : logs)
            const logsChannel = guild.channels.cache.find(channel => channel.id === config.logsChannel);
            const logsStatus = logsChannel
                ? logsChannel.permissionsFor(botMember).has(['ViewChannel', 'SendMessages'])
                    ? `✅ ${t("Canal logs disponible")} : #${logsChannel.name}`
                    : `❌ ${t("Permissions insuffisantes pour envoyer des messages dans le canal logs")}.`
                : `❌ ${t("Canal logs introuvable")}.`;

            const announcementsChannel = guild.channels.cache.find(channel => channel.id === config.announcementsChannel);
            const announcementsStatus = announcementsChannel
                ? announcementsChannel.permissionsFor(botMember).has(['ViewChannel', 'SendMessages'])
                    ? `✅ ${t("Canal annonces disponible")} : #${announcementsChannel.name}`
                    : `❌ ${t("Permissions insuffisantes pour envoyer des messages dans le canal annonces") }.`
                : `❌ ${t("Canal annonces introuvable")}.`;

            const updatesChannel = guild.channels.cache.find(channel => channel.id === config.updatesChannel);
            const updatesStatus = updatesChannel
                ? updatesChannel.permissionsFor(botMember).has(['ViewChannel', 'SendMessages'])
                    ? `✅ ${t("Canal updates disponible")} : #${updatesChannel.name}`
                    : `❌ ${t("Permissions insuffisantes pour envoyer des messages dans le canal updates")}.`
                : `❌ ${t("Canal updates introuvable")}.`;

            

            // 5. Vérification du temps de latence
            const latency = Date.now() - interaction.createdTimestamp;
            const latencyStatus = `✅ Latence du bot : ${latency} ms.`;

            // Création de l'embed de diagnostic
            const embed = new EmbedBuilder()
                .setTitle(`🔎 ${t("Diagnostic du bot")}`)
                .setDescription(t("Voici les résultats du diagnostic du bot :"))
                .addFields(
                    { name:  `${t("Statut des permissions")}`, value: permissionStatus, inline: false },
                    { name: `${t("Statut websocket")}`, value: isWebSocketConnected, inline: false },
                    { name: `${t("Statut du canal logs")}`, value: logsStatus, inline: false },
                    { name:  `${t("Statut du canal annonces")}`, value: announcementsStatus, inline: false },
                    { name: `${t("Statut du canal updates")}`, value: updatesStatus, inline: false },
                    { name: `${t("Latence")}`, value: latencyStatus, inline: false }
                )
                .setColor(
                    [permissionStatus, isWebSocketConnected, logsStatus, announcementsStatus, updatesStatus].some(status =>
                        status.startsWith('❌')) ? 'Red' : 'Green'
                )
                .setTimestamp();

            // Répondre avec l'embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors du diagnostic :', error);
            await interaction.editReply({
                content: `❌ ${t("Une erreur s'est produite lors de l'exécution du diagnostic.")}`,
                ephemeral: true,
            });
        }
    },
};
