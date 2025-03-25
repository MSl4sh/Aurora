const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require("discord.js");
const AutoModConfig = require("../models/autoModSchema");
const colorTable = require("../utils/colorTable");
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("whitelist")
        .setDescription("Manage whitelisted roles and channels.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName("add-role")
                .setDescription("Add a role to the whitelist.")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Select the role to whitelist.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("remove-role")
                .setDescription("Remove a role from the whitelist.")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Select the role to remove from whitelist.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("list-roles")
                .setDescription("List all whitelisted roles.")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("add-channel")
                .setDescription("Add a channel to the whitelist.")
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("Select the channel to whitelist.")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                        
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("remove-channel")
                .setDescription("Remove a channel from the whitelist.")
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("Select the channel to remove from whitelist.")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("list-channels")
                .setDescription("List all whitelisted channels.")
        ),

    async execute(interaction, server) {
        const guildId = interaction.guild.id;
        let config = await AutoModConfig.findOne({ guildId });
        const logChannelId = server.config.moderationLogsChannel;
        const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
        
        if (!config) {
            return interaction.reply({
                content: "La configuration de l'auto-modération n'a pas encore été créée. Utilisez `/automod` pour la configurer.",
                ephemeral: true,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        let embed = new EmbedBuilder().setColor(colorTable.info);

        switch (subcommand) {
            case "add-role":
                const role = interaction.options.getRole("role");
                if (config.whitelistRoles.includes(role.id)) {
                    return interaction.reply({ content: "Ce rôle est déjà whitelisté.", ephemeral: true });
                }
                config.whitelistRoles.push(role.id);
                embed.setDescription(`✅ Le rôle ${role} a été ajouté à la whitelist.`);
                break;

            case "remove-role":
                const roleToRemove = interaction.options.getRole("role");
                config.whitelistRoles = config.whitelistRoles.filter(id => id !== roleToRemove.id);
                embed.setDescription(`❌ Le rôle ${roleToRemove} a été retiré de la whitelist.`);
                break;

            case "list-roles":
                embed.setTitle("Roles Whitelistés");
                embed.setDescription(config.whitelistRoles.length > 0 ? config.whitelistRoles.map(id => `<@&${id}>`).join(", ") : "Aucun rôle whitelisté.");
                break;

            case "add-channel":
                const channel = interaction.options.getChannel("channel");
                if (config.whitelistChannels.includes(channel.id)) {
                    return interaction.reply({ content: "Ce salon est déjà whitelisté.", ephemeral: true });
                }
                config.whitelistChannels.push(channel.id);
                embed.setDescription(`✅ Le salon ${channel} a été ajouté à la whitelist.`);
                break;

            case "remove-channel":
                const channelToRemove = interaction.options.getChannel("channel");
                config.whitelistChannels = config.whitelistChannels.filter(id => id !== channelToRemove.id);
                embed.setDescription(`❌ Le salon ${channelToRemove} a été retiré de la whitelist.`);
                break;

            case "list-channels":
                embed.setTitle("Salons Whitelistés");
                embed.setDescription(config.whitelistChannels.length > 0 ? config.whitelistChannels.map(id => `<#${id}>`).join(", ") : "Aucun salon whitelisté.");
                break;
        }
        
        await config.save();
        await interaction.reply({ embeds: [embed], ephemeral: true });
        if (!hasChannelPermissions(logChannel)) {
            return interaction.reply({
                content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
                ephemeral: true
            });
        }

        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
};
