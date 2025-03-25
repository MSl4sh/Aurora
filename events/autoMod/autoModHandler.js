const fs = require("fs");
const path = require("path");

const rules = [];

// Charger dynamiquement toutes les règles dans le dossier "rules"
fs.readdirSync(path.join(__dirname, "rules")).forEach(file => {
    if (file.endsWith(".js")) {
        const rule = require(`./rules/${file}`);
        rules.push(rule);
    }
});

module.exports = {
    async execute(message, config) {
        let violations = [];

        for (const rule of rules) {
            const result = await rule.execute(message, config);
            if (result) violations.push(result);
        }

        return violations;
    }
};
