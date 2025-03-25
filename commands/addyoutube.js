function extractRssUrl(youtubeUrl) {
    // Ex: https://www.youtube.com/channel/UC123XYZ -> channelId = UC123XYZ
    const match = youtubeUrl.match(/youtube\.com\/channel\/(UC[0-9A-Za-z_\-]+)/);
    if (!match) return null;
    const channelId = match[1]; 
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }
  

  // commands/addyoutube.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const RSSParser = require('rss-parser');
const parseVideoId = require('../utils/parseVideoId');
const hasChannelPermissions = require('../utils/checkBotPermissions');

const parser = new RSSParser();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addyoutube')
    .setDescription('Add a YouTube channel to the watchlist.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('url')
        .setDescription('the complete URL of the YouTube channel (e.g. https://www.youtube.com/channel/UCxxxx)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send notifications to')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to mention when a new video is posted')
        .setRequired(false),
    ),

  async execute(interaction, server) {

    const config = server.config;
    const useTranslate = require('../i18n');
    const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
    const youtubeUrl = interaction.options.getString('url');
    const notifyChannel = interaction.options.getChannel('channel');
    const notifyRole = interaction.options.getRole('role');

    const getNotifyChannel = interaction.guild.channels.cache.get(notifyChannel.id);

    // Vérifications
    if (!getNotifyChannel) {
      return interaction.reply({
        content: `❌Impossible de trouver le salon de notification.`,
        ephemeral: true
      });
    }

    if (!hasChannelPermissions(getNotifyChannel)) {
      return interaction.reply({
          content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
          ephemeral: true
      });
  }


    // 1) Extraire le flux RSS
    const rssUrl = extractRssUrl(youtubeUrl);
    if (!rssUrl) {
      return interaction.reply({ 
        content: `❌ ${t("Impossible de convertir cette URL en flux RSS. Veuillez fournir une URL du type")}: https://www.youtube.com/channel/UCxxxx\n` +
                 `${t("Pour récupérer l'URL compléte de votre chaîne YouTube, rendez vous dans votre Youtube Studio => Personnalisation => URL de la chaîne")}`,
        ephemeral: true 
      });
    }

    // 3) Vérifier si la chaîne n'est pas déjà enregistrée
    const alreadyExists = config.youtubeChannels.some(c => c.rssUrl === rssUrl);
    if (alreadyExists) {
      return interaction.reply({
        content: `❌ ${t("Cette chaîne est déjà surveillée.")}`,
        ephemeral: true
      });
    }

    let lastVideoId = '';
    try {
      const feed = await parser.parseURL(rssUrl);
      if (feed.items && feed.items.length > 0) {
        const latestVideo = feed.items[0];
        // Parfois, latestVideo.id ressemble à "yt:video:XXXXXXXX"
        //extraire l'ID pur si nécessaire :
        lastVideoId = parseVideoId(latestVideo.id) || latestVideo.id;
      }
    } catch (err) {
      console.error('Erreur de parsing du flux RSS :', err);
      return interaction.reply({
        content: `❌ ${t("Impossible de récupérer le flux RSS (erreur de parsing).")}`,
        ephemeral: true
      });
    }



    if (config.youtubeChannels.length >= 1) {
      config.youtubeChannels = [{
        rssUrl,
        lastVideoId,
        notifyChannelId: notifyChannel.id,
        roleId: notifyRole ? notifyRole.id : null
      }];
        await config.save();
        return interaction.reply(`✅ ${t("La chaîne a été ajoutée ! Les nouvelles vidéos seront annoncées au rôle séléctionné dans")} <#${notifyChannel.id}>.`);

    }

    // 4) Ajouter l'entrée
    config.youtubeChannels.push({
      rssUrl,
      lastVideoId,
      notifyChannelId: notifyChannel.id,
      roleId: notifyRole ? notifyRole.id : null
    });
    await config.save();

    // 5) Répondre
    return interaction.reply(`✅ La chaîne a été ajoutée ! Les nouvelles vidéos seront annoncées ${notifyRole ? `avec le rôle ${notifyRole}` : ''} dans <#${notifyChannel.id}>.`);
  }
};
