const cron = require('node-cron');
const RSSParser = require('rss-parser');
const parser = new RSSParser();

// Import de tes modèles
const Server = require('../models/serverSchema'); // Le "Server"
const parseVideoId = require('../utils/parseVideoId') // fonction utilitaire éventuelle

module.exports = function setupYoutubeCron(client) {
  // Exécuter la tâche toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking YouTube feeds...');

    try {
      // 1) Récupérer tous les serveurs, et peupler le champ "config"
      const servers = await Server.find({}).populate('config');
      // => servers est un tableau de documents "Server"
      // => server.config est un doc "ServerConfig" (ou null si pas de config)

      // 2) Parcourir chaque serveur
      for (const server of servers) {
        const guild = client.guilds.cache.get(server.guildId);
        const config = server.config;
        const roleToPing = guild.roles.cache.get(config.roleToPing);
        if (!guild) continue; // le bot n'est peut-être plus sur ce serveur

        // 3) Vérifier qu'il y a une config (populate a chargé server.config)
        if(!server.config.guildLanguage) continue;

        // Récupérer le tableau de chaînes
        const { youtubeChannels } = server.config;
        if (!youtubeChannels || youtubeChannels.length === 0) continue;

        // 4) Pour chaque chaîne surveillée
        for (const channelData of youtubeChannels) {
          const { rssUrl, lastVideoId, notifyChannelId, roleId } = channelData;

          // Parser le flux
          let feed;
          try {
            feed = await parser.parseURL(rssUrl);
          } catch (err) {
            console.error(`Erreur de parsing sur ${rssUrl}:`, err);
            continue;
          }

          // Checker la vidéo la plus récente
          if (!feed.items || feed.items.length === 0) continue;
          const latestVideo = feed.items[0];

          // Extraire l'ID (selon ton format ou parseVideoId)
          const videoId = parseVideoId(latestVideo.id) || latestVideo.id;

          // Vérifier si c'est un nouvel ID par rapport à lastVideoId
          if (videoId && videoId !== lastVideoId) {
            // => Nouvelle vidéo
            console.log(`Nouvelle vidéo pour ${rssUrl}: ${latestVideo.link}`);

            // Chercher le channel Discord
            const discordChannel = client.channels.cache.get(notifyChannelId);
            if (!discordChannel) continue;

            // Récupérer le rôle spécifique à cette chaîne
            const roleToPing = roleId ? guild.roles.cache.get(roleId) : null;

            // Envoyer la notification
            discordChannel.send(
              `${roleToPing ? `${roleToPing}` : ''} Nouvelle vidéo postée sur la chaîne ! **${latestVideo.title}**\n${latestVideo.link}`
            );

            // Mettre à jour lastVideoId
            channelData.lastVideoId = videoId;
          }
        } // fin du for youtubechannels

        // 5) Sauvegarder le doc config (avec lastVideoId mis à jour)
        await config.save();
      } // fin du for servers

    } catch (error) {
      console.error('[CRON] Erreur générale YouTube feed:', error);
    }
  });
};
