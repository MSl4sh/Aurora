const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('../models/userSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Display your XP and level.'),
    async execute(interaction, server) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const config = server.config;
        const useTranslate = require('../i18n');
        const { t } = useTranslate(config.guildLanguage === 'en' ? 'en' : '');

        if (!config.xpSystem) {
            return interaction.reply({
                content: "❌ Le système d'XP n'est pas activé.",
                ephemeral: true,
            });
        }
        
        const member = interaction.member;

        if (
            member.permissions.has(PermissionFlagsBits.Administrator) ||
            member.permissions.has(PermissionFlagsBits.ModerateMembers)
        ) {
            return interaction.reply({
                content: "⛔ Votre rôle ne vous permet pas d'accumuler de l'XP.",
                ephemeral: true,
            });
        }


        // Récupérer les données de l'utilisateur
        let user = await User.findOne({ guildId, userId });

        if (!user) {
            return interaction.reply({
                content: 'Vous n\'avez pas encore gagné d\'XP. Commencez à participer !',
                ephemeral: true,
            });
        }

        const currentLevel = user.level;
        const currentXP = user.xp;

        // Calculer l'XP requis pour le prochain niveau
        const nextLevelXP = 5 * (currentLevel ** 2) + 50 * currentLevel + 100;
        const canvas = createCanvas(350, 110);
        const ctx = canvas.getContext('2d');

        // Fond
        ctx.fillStyle = '#313338'; // Couleur de fond
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Texte principal
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${t("Niveau")} : ${currentLevel}`, 100, 35);
        ctx.fillText(`XP : ${currentXP} / ${nextLevelXP}`, 100, 55);

        // Barre de progression
        const progressBarX = 100;
        const progressBarY = 75;
        const progressBarWidth = 200;
        const progressBarHeight = 10;

// Calcul du pourcentage d'avancement
const progressFraction = (currentXP / nextLevelXP).toFixed(2);

// Calcul de la largeur de la progression
const progressWidth = progressBarWidth * progressFraction;

// Dessin de la barre de progression
ctx.fillStyle = '#6203fc'; // Couleur de la progression
ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);


// Encadrer la barre
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 1;
ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);


        // Avatar de l'utilisateur
        const avatarURL = interaction.user.displayAvatarURL({ format: 'png' });
        const avatar = await loadImage(avatarURL);
        const avatarX = 20; // Position X du cercle
        const avatarY = 25;  // Position Y du cercle
        const avatarRadius = 30; // Rayon du cercle

        // Dessiner un cercle pour l'avatar
        ctx.save(); // Sauvegarde de l'état du contexte
        ctx.beginPath();
        ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip(); // Définir une zone de découpe circulaire

        // Dessiner l'avatar dans le cercle
        ctx.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
        ctx.restore(); // Restaurer l'état initial du contexte

        // Convertir en pièce jointe
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'level.png' });

        // Réponse avec l'image
        return interaction.reply({
            content: `🎉 ${t("Voici votre progression")}, **${interaction.user.displayName}** :`,
            files: [attachment],
        });
    },
};

