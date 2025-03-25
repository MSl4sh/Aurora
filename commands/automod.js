const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const hasChannelPermissions = require("../utils/checkBotPermissions");
const AutoModConfig = require("../models/autoModSchema");
const useTranslate = require("../i18n");
const colorTable = require("../utils/colorTable");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("Manage auto-moderation settings.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName("toggle")
                .setDescription("Enable or disable auto-moderation.")
                .addBooleanOption(option =>
                    option.setName("status")
                        .setDescription("Enable/Disable auto-moderation.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("add-rule")
                .setDescription("Add or modify an auto-moderation rule.")
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("Type of rule to add")
                        .setRequired(true)
                        .addChoices(
                            { name: "Blacklist Words", value: "blacklistWords" },
                            { name: "Block Links", value: "blockLinks" },
                            { name: "Caps Spam", value: "capsSpam" },
                            { name: "Emoji Spam", value: "emojiSpam" },
                            { name: "Repeat Spam", value: "repeatSpam" }
                        )
                )
                .addBooleanOption(option =>
                    option.setName("enabled")
                        .setDescription("Enable or disable this rule.")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("threshold")
                        .setDescription("Threshold for triggering this rule.")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("action")
                        .setDescription("Action to apply when the rule is triggered.")
                        .setRequired(false)
                        .addChoices(
                            { name: "Warn", value: "warn" },
                            { name: "Mute", value: "mute" },
                            { name: "Kick", value: "kick" },
                            { name: "Ban", value: "ban" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("blacklist")
                .setDescription("Manage the blacklist words.")
                .addStringOption(option =>
                    option.setName("action")
                        .setDescription("Action to perform on the blacklist.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Add", value: "add" },
                            { name: "Remove", value: "remove" },
                            { name: "List", value: "list" }
                        )
                )
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word to add or remove.")
                        .setRequired(false)
                )
        ),

    async execute(interaction, server) {
        const guildId = interaction.guild.id;
        let config = await AutoModConfig.findOne({ guildId });
        const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");

        if (!config) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle("⚠️ Auto-modération non configurée")
                    .setDescription(t("La configuration de l'auto-modération n'a pas encore été créée. Utilisez `/automod` pour la configurer."))
                    .setColor(colorTable.warning)],
                ephemeral: true,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const logChannelId = server.config.moderationLogsChannel;
        const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;

        switch (subcommand) {
            case "toggle":
                config.enabled = interaction.options.getBoolean("status");
                await config.save();

                const toggleEmbed = new EmbedBuilder()
                    .setTitle("🛡️ Auto-modération mise à jour")
                    .setDescription(t("Auto-modération {status}.").replace("{status}", config.enabled ? "activée" : "désactivée"))
                    .setColor(config.enabled ? colorTable.success : colorTable.danger);

                    logChannel?.send({ embeds: [toggleEmbed] });

                await interaction.reply({content:"✅ La configuration de l'auto-modération a été mise à jour.", ephemeral: true });
                break;

            case "add-rule":
                const type = interaction.options.getString("type");
                const enabled = interaction.options.getBoolean("enabled");
                const threshold = interaction.options.getInteger("threshold") || 5;
                const action = interaction.options.getString("action") || "warn";

                if(type === "Blacklist Words" ) {
                    config.moderationRules.blacklistWords = { enabled, list: [], action };
                }else{
                    config.moderationRules[type] = { enabled, threshold, action, type };

                }



                await config.save();

                const ruleEmbed = new EmbedBuilder()
                    .setTitle("✅ Règle mise à jour")
                    .setDescription(t("La règle {type} a été mise à jour.").replace("{type}", type))
                    .setColor(colorTable.success);

                    logChannel?.send({ embeds: [ruleEmbed] });

                await interaction.reply({content:"✅ La nouvelle règle a été ajoutée avec succès ! ", ephemeral: true });
                break;

            case "blacklist":
                const actionType = interaction.options.getString("action");
                const word = interaction.options.getString("word")?.toLowerCase();

                let blacklistEmbed = new EmbedBuilder().setColor(colorTable.info);

                if (actionType === "add") {
                    if (!word) return interaction.reply({ content: t("Vous devez spécifier un mot."), ephemeral: true });
                    if (config.moderationRules.blacklistWords.list.includes(word)) return interaction.reply({ content: t("Ce mot est déjà dans la liste."), ephemeral: true });
                    config.moderationRules.blacklistWords.list.push(word);
                    blacklistEmbed.setTitle("✅ Mot ajouté").setDescription(`Le mot **${word}** a été ajouté à la blacklist.`);
                }
                if (actionType === "remove") {
                    if (!word) return interaction.reply({ content: t("Vous devez spécifier un mot."), ephemeral: true });
                    config.moderationRules.blacklistWords.list = config.moderationRules.blacklistWords.list.filter(w => w !== word);
                    blacklistEmbed.setTitle("❌ Mot supprimé").setDescription(`Le mot **${word}** a été supprimé de la blacklist.`);
                }
                if (actionType === "list") {
                    blacklistEmbed.setTitle("📜 Liste des mots interdits").setDescription(config.moderationRules.blacklistWords.list.length > 0 ? config.moderationRules.blacklistWords.list.join(", ") : t("La liste est vide."));
                    return interaction.reply({ embeds: [blacklistEmbed], ephemeral: true });
                }
                await config.save();
                if (!hasChannelPermissions(logChannel)) {
                    return interaction.reply({
                        content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans ce canal.",
                        ephemeral: true
                    });
                }
                logChannel?.send({ embeds: [blacklistEmbed] });
                await interaction.reply({content:"✅ La liste noire a été mise à jour.", ephemeral: true });
                break;
        }
    }
};
