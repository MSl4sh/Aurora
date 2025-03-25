const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-level-reward')
        .setDescription("Set a role as a reward for reaching a certain level.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('level')
            .setDescription('Level to reach to get the reward.')
            .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
            .setDescription('Role to be given as a reward.')
            .setRequired(true)
        ),
    async execute(interaction, server) {
        const role = interaction.options.getRole('role');
        const level = interaction.options.getInteger('level');
        const serverConfig = server.config;
        const useTranslate = require('../i18n');
        const { t } = useTranslate(serverConfig.guildLanguage === 'en' ? 'en' : '');

        if (!serverConfig.xpSystem) {
            return interaction.reply({
                content: t("❌ Le système d'XP n'est pas activé."),
                ephemeral: true,
            });
        }

        if (level < 1) {
            return interaction.reply({
                content: t("❌ Le niveau doit être supérieur à 0."),
                ephemeral: true,
            });
        }

        if (server.config.levelRewards.find(r => r.level === level)) {
            return interaction.reply({
                content: t("❌ Un rôle est déjà défini pour ce niveau."),
                ephemeral: true,
            });
        }

        if (server.config.levelRewards.find(r => r.role === role.id)) {
            return interaction.reply({
                content: t("❌ Ce rôle est déjà défini comme récompense."),
                ephemeral: true,
            });
        }

        if(server.config.levelRewards.length >= 5) {
            return interaction.reply({
                content: t("❌ Vous avez déjà atteint le nombre maximum de récompenses."),
                ephemeral: true,
            });
        }
        try{
            server.config.levelRewards.push({ level, roleId: role.id });
    
            await server.config.save();

            const embed = new EmbedBuilder()
                .setTitle(t("Récompense de niveau ajoutée"))
                .setDescription(t("Le rôle {role} a été défini comme récompense pour le niveau {level}.".replace("{role}", role.name).replace("{level}", level)))
                .setColor(colorTable.success)
                .setTimestamp();
            
            await interaction.guild.channels.cache.get(server.config.logsChannel).send({ embeds: [embed] });

            return interaction.reply({
                content: t("✅ La récompense a été ajoutée avec succès."),
                ephemeral: true,
            });


        }catch(err){
            console.error(err);
            return interaction.reply({
                content: t("❌ Une erreur s'est produite lors de l'ajout de la récompense."),
                ephemeral: true,
            });
        }




        
    
    },
};
