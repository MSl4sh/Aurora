module.exports = {
    name: "blacklistWords",
    async execute(message, config) {
        if (!config.moderationRules.blacklistWords.enabled) return;

        const { content} = message;
        const forbiddenWords = config.moderationRules.blacklistWords.list;

        if (forbiddenWords.some(word => content.toLowerCase().includes(word.toLowerCase()))) {
            message.delete().catch(() => {});
            return {
                rule: "Blacklist Words",
                action: config.moderationRules.blacklistWords.action
            };
        }
    }
};
