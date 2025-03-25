const infractions = new Map();

module.exports = {
    name: "repeatSpam",
    async execute(message, config) {
        if (!config.moderationRules.repeatSpam.enabled) return;

        const userKey = `${message.guild.id}-${message.author.id}`;
        const lastMessage = infractions.get(userKey);

        if (lastMessage === message.content) {
            message.delete().catch(() => {});
            return {
                rule: "Repeat Spam",
                action: config.moderationRules.repeatSpam.action
            };
        }

        infractions.set(userKey, message.content);
        setTimeout(() => infractions.delete(userKey), 10000);
    }
};
