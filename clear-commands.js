const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Suppression des commandes globales...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('Commandes globales supprimées avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression des commandes globales :', error);
    }
})();
