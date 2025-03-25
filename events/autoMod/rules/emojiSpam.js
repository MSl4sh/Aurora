module.exports = {
    name: "emojiSpam",
    async execute(message, config) {
        if (!config.moderationRules.emojiSpam.enabled) return;

        const emojiCount = (message.content.match(/[\u{1F300}-\u{1F6FF}]/gu) || []).length;
        if (emojiCount > config.moderationRules.emojiSpam.threshold) {
            message.delete().catch(() => {});
            return {
                rule: "Emoji Spam",
                action: config.moderationRules.emojiSpam.action
            };
        }
    }
};
