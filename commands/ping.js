const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('A classic ping command.'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
