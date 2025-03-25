module.exports = {
    name: "blockLinks",
    async execute(message, config) {
        if (!config.moderationRules.blockLinks.enabled) return;

        if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
            message.delete().catch(() => {});
            return {
                rule: "Block Links",
                action: config.moderationRules.blockLinks.action
            };
        }
    }
};
