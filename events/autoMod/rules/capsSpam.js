module.exports = {
    name: "capsSpam",
    async execute(message, config) {
        if (!config.moderationRules.capsSpam.enabled) return;

        const capsRatio = message.content.replace(/[^A-Z]/g, "").length / message.content.length;
        if (capsRatio > 0.6 && message.content.length > config.moderationRules.capsSpam.threshold) {
            message.delete().catch(() => {});
            return {
                rule: "Caps Spam",
                action: config.moderationRules.capsSpam.action
            };
        }
    }
};
