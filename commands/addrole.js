const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-role')
        .setDescription('Donne un Rôle à un utilisateur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => 
            option.setName('user')
                .setDescription("L'utilisateur à qui donner le rôle.")
                .setRequired(true)
        )
        .addRoleOption(option => 
            option.setName('role')
                .setDescription("Le rôle à donner à l'utilisateur.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const utilisateur = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        
        const member = interaction.guild.members.cache.get(utilisateur.id);
        
        // Vérifications
        if (!member) {
            return interaction.reply({
                content: `❌ Impossible de trouver l'utilisateur mentionné sur ce serveur.`,
                ephemeral: true
            });
        }
        if(!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: `❌ Je n'ai pas la permission de gérer les rôles. Veuillez vérifier mes permissions.`, ephemeral: true });
        }

        if (interaction.member.roles.highest.position <= role.position && !interaction.guild.ownerId === interaction.user.id) {
            return interaction.reply({
                content: `❌ Vous ne pouvez pas attribuer un rôle supérieur ou égal à votre rôle le plus élevé.`,
                ephemeral: true
            });
        }

        if (interaction.guild.members.me.roles.highest.position <= role.position) {
            return interaction.reply({
                content: `❌ Mon rôle doit être supérieur à celui que vous essayez d'attribuer.`,
                ephemeral: true
            });
        }

        try {
            // Ajouter le rôle
            await member.roles.add(role);

            // Répondre à l'utilisateur
            await interaction.reply({
                content: `✅ Le rôle **${role.name}** a été attribué à **${utilisateur.displayName}** avec succès !`,
                ephemeral: true
            });
        } catch (error) {
            console.error(`Erreur lors de l'attribution du rôle :`, error);
            await interaction.reply({
                content: `❌ Une erreur est survenue lors de l'attribution du rôle. Vérifiez mes permissions et réessayez.`,
                ephemeral: true
            });
        }
    }
};
