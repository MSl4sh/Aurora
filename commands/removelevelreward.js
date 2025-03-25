const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const colorTable = require('../utils/colorTable');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-level-reward')
        .setDescription("Remove one or all level rewards.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('level')
            .setDescription('The level to remove the reward from.')
            .setRequired(false)
        ),
        
    async execute(interaction, server) {
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

        if(!serverConfig.levelRewards || serverConfig.levelRewards.length === 0){
            return interaction.reply({
                content: t("❌ Aucune récompense de niveau n'a été définie."),
                ephemeral: true,
            });
        }

        if (level < 1) {
            return interaction.reply({
                content: t("❌ Le niveau doit être supérieur à 0."),
                ephemeral: true,
            });
        }

        if(level && !serverConfig.levelRewards.find(r => r.level === level)){
            return interaction.reply({
                content: t("❌ Aucune récompense de niveau n'a été définie pour ce niveau."),
                ephemeral: true,
            });
        }

        try{
            
            
            if(level){
                serverConfig.levelRewards = serverConfig.levelRewards.filter(r => r.level !== level);
                await server.config.save();

                const embed = new EmbedBuilder()
                    .setTitle(t("Récompense de niveau supprimée"))
                    .setDescription(t("La récompense pour le niveau {level} a été supprimée.".replace("{level}", level)))
                    .setColor(colorTable.success)
                    .setTimestamp();

                await interaction.guild.channels.cache.get(server.config.moderationLogsChannel).send({ embeds: [embed] });

                return interaction.reply({
                    content: t("✅ La récompense a été supprimée avec succès."),
                    ephemeral: true,
                });
            }

            serverConfig.levelRewards = [];
    
            await server.config.save();

            const embed = new EmbedBuilder()
                .setTitle(t("Récompenses de niveau supprimées"))
                .setDescription(t("Toutes les récompenses de niveau ont été supprimées."))
                .setColor(colorTable.success)
                .setTimestamp();
            
            await interaction.guild.channels.cache.get(server.config.logsChannel).send({ embeds: [embed] });

            return interaction.reply({
                content: t("✅ Toutes les récompenses ont été supprimées avec succès."),
                ephemeral: true,
            });


        }catch(err){
            console.error(err);
            return interaction.reply({
                content: t("❌ Une erreur s'est produite lors de la suppression de la récompense."),
                ephemeral: true,
            });
        }




        
    
    },
};
