require('dotenv').config(); // Charge les variables d'environnement depuis .env
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const { connectToDatabase } = require('./utils/database');
const setupYoutubeCron = require('./tasks/youtubeCron');
const setupReactionRoles = require('./utils/setupReactionRoles');
const Server = require('./models/serverSchema');

// Récupération du token depuis .env
const token = process.env.DISCORD_TOKEN;

// Connexion à MongoDB
connectToDatabase();


// Création du client Discord avec les intentions nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Pour les commandes slash
        GatewayIntentBits.GuildMembers, // Pour détecter les nouveaux membres
        GatewayIntentBits.GuildMessages, // Pour lire les messages dans les salons
        GatewayIntentBits.MessageContent, // Pour lire le contenu des messages
        GatewayIntentBits.GuildMessageReactions, // Pour gérer les réactions
        GatewayIntentBits.GuildVoiceStates, // Pour suivre les changements de statut vocal
        GatewayIntentBits.GuildPresences, // Pour suivre les présences des membres
    ],
});

// Collection pour les commandes
client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Commande chargée : ${command.data.name}`);
    } else {
        console.warn(`❌ La commande dans ${file} est invalide et n'a pas été chargée.`);
    }
}


// Chargement des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.name) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`✅ Événement chargé : ${event.name}`);
    } else {
        console.warn(`❌ L'événement dans ${file} est invalide et n'a pas été chargé.`);
    }
}

const birthdayCron = require('./tasks/birthdayCron');
birthdayCron(client);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const requiredPermissions = [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ViewAuditLog,
        PermissionFlagsBits.ManageWebhooks,
    ];

    const permissionNames = {
        [PermissionFlagsBits.ManageRoles]: "Gérer les rôles",
        [PermissionFlagsBits.ManageChannels]: "Gérer les salons",
        [PermissionFlagsBits.SendMessages]: "Envoyer des messages",
        [PermissionFlagsBits.EmbedLinks]: "Envoyer des liens intégrés",
        [PermissionFlagsBits.ViewChannel]: "Voir les salons",
        [PermissionFlagsBits.ReadMessageHistory]: "Lire l'historique des messages",
        [PermissionFlagsBits.UseExternalEmojis]: "Utiliser des émojis externes",
        [PermissionFlagsBits.AddReactions]: "Ajouter des réactions",
        [PermissionFlagsBits.ManageMessages]: "Gérer les messages",
        [PermissionFlagsBits.ViewAuditLog]: "Voir les logs d'audit",
        [PermissionFlagsBits.ManageWebhooks]: "Gérer les webhooks",
    };

    // Vérifier que le bot peut accéder aux permissions
    if (!interaction.channel || !interaction.guild) {
        return interaction.reply({
            content: "🚫 Impossible de vérifier les permissions du bot.",
            ephemeral: true,
        });
    }
    

    // Récupérer les informations du bot
    const botMember = await interaction.guild.members.fetchMe();
    if (!botMember) {
        return interaction.reply({
            content: "🚫 Impossible de récupérer les informations du bot.",
            ephemeral: true,
        });
    }

    // Vérifier les permissions du bot dans le canal de l'interaction
    const botPermissions = interaction.channel.permissionsFor(botMember);
    if (!botPermissions) {
        return interaction.reply({
            content: "🚫 Impossible de récupérer les permissions du bot dans ce canal.",
            ephemeral: true,
        });
    }

    // Vérifier les permissions manquantes
    const missingPermissions = requiredPermissions.filter(perm => !botPermissions.has(perm))
    .map(perm => permissionNames[perm] || `Permission inconnue (${perm})`);

    if (missingPermissions.length > 0) {
        return interaction.reply({
            content: `❌ Permissions manquantes : ${missingPermissions.map(perm => `\`${perm}\``).join(", ")}`,
            ephemeral: true,
        });
    }

    if (!interaction.guild) {
        await interaction.deferReply({ ephemeral: true }); // Marquer l'interaction comme différée
        return interaction.editReply({
            content: '❌ Les commandes ne peuvent être exécutées qu\'à l\'intérieur d\'un serveur.',
        });
    }

    // Chercher les informations du serveur
    let server;
    try {
        server = await Server.findOne({ guildId: interaction.guild.id }).populate('config');
    } catch (error) {
        console.error('Erreur lors de la récupération du serveur :', error);
        return interaction.reply({
            content: '❌ Une erreur est survenue lors de la récupération de la configuration du serveur.',
            ephemeral: true,
        });
    }

    // Si le serveur n'est pas trouvé ou mal configuré
    if (!server || !server.config) {
        if (interaction.commandName !== 'config') {
            return interaction.reply({
                content: '❌ La configuration du serveur est introuvable ou inexistante. Seule la commande `/config` est disponible pour configurer le bot.',
                ephemeral: true,
            });
        }
    }

    // Si la commande n'est pas la commande `config` mais une configuration obligatoire est manquante
    if (!server.config.welcomeChannel && interaction.commandName !== 'config') {
        return interaction.reply({
            content: '❌ Une configuration obligatoire est manquante. Veuillez utiliser `/config` pour configurer le bot.',
            ephemeral: true,
        });
    }

    // Récupérer la commande
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        return interaction.reply({
            content: '❌ Commande inconnue ou non enregistrée.',
            ephemeral: true,
        });
    }
    const ServerConfig = require('./models/serverConfig');
    const config = await ServerConfig.findOne({ guild: interaction.guild.id });
    

    // Exécution de la commande
    try {
        await command.execute(interaction, server);
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName} :`, error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
            ephemeral: true,
        });
    }
});



client.on('messageReactionAdd', (reaction, user) => {
    const event = require('./events/messageReactionAdd');
    event.execute(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
    const event = require('./events/messageReactionRemove');
    event.execute(reaction, user);
});


const updateServerStats = async () => {
    const guild = await client.guilds.fetch(process.env.SUPPORT_SERVER); 
    const channel = guild.channels.cache.get(process.env.SERVER_STATS_CHANNEL); 

    if (!channel) {
        console.error('Canal non trouvé.');
        return;
    }

    const serverCount = client.guilds.cache.size;
    const newName = `🌐 Serveurs : ${serverCount}`;

    try {
        await channel.setName(newName);
        console.log(`Nom du canal mis à jour : ${newName}`);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du canal :', error);
    }
};


// Appeler la fonction au démarrage
client.once('ready', async () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
    await setupReactionRoles(client);
    setupYoutubeCron(client);
    updateServerStats();
    // Mettre à jour régulièrement
    setInterval(updateServerStats, 3600000); // Toutes les heures
});

// client.once("ready", async () => {
//     console.log(`Connecté en tant que ${client.user.tag}`);

//     const guilds = client.guilds.cache;
    
//     if (guilds.size === 0) {
//         console.log("Le bot n'est sur aucun serveur.");
//         return process.exit(0);
//     }

//     for (const [guildId, guild] of guilds) {
//         try {
//             console.log(`Quitte le serveur : ${guild.name} (${guildId})`);
//             await guild.leave();
//         } catch (error) {
//             console.error(`Erreur en quittant ${guild.name} (${guildId}):`, error);
//         }
//     }

//     console.log("Le bot a quitté tous les serveurs.");
//     process.exit(0);
// });

// Mettre à jour lors des événements
client.on('guildCreate', updateServerStats);
client.on('guildDelete', updateServerStats);




// Connexion du bot
client.login(token).then(() => {
    console.log('Bot connecté avec succès.');
}).catch(error => {
    console.error('Erreur lors de la connexion du bot :', error);
});
