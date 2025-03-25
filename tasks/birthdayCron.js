const cron = require('node-cron');
const ServerConfig = require('../models/serverConfig');
const { EmbedBuilder } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = (client) => {
    cron.schedule('0 9 * * *', async () => {
        console.log('Vérification des anniversaires du jour...');
        const servers = await ServerConfig.find();

        servers.forEach(async serverConfig => {
            const now = new Date();
            const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD

            const birthdaysToday = serverConfig.birthdays.filter(b => {
                const birthday = b.birthday.toISOString().split('T')[0];
                return birthday === today;
            });

            if (birthdaysToday.length === 0 || !serverConfig.welcomeChannel) return;

            const guild = await client.guilds.fetch(serverConfig.guild);

            const logChannel = guild.channels.cache.get(serverConfig.welcomeChannel);
            const embed = new EmbedBuilder()
                .setColor(colorTable.success)
                .setTitle('🎉 Anniversaire du jour 🎉')
                .setDescription(`🎉 Bon anniversaire <@${b.userId}> ! Profites bien de ta journée ! 🎉`);

            birthdaysToday.forEach(b => {
                logChannel.send({ embeds: [embed] });
            });
        });
    });
};
