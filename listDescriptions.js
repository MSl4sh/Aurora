const fs = require('fs');
const path = require('path');

async function listCommandDescriptions() {
    const commandsDir = path.join(__dirname, 'commands'); // Chemin du dossier "commands"
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js')); // Fichiers .js uniquement

    console.log("Liste des descriptions des commandes :");

    for (const file of commandFiles) {
        const filePath = path.join(commandsDir, file);

        try {
            const command = require(filePath); // Charger chaque commande

            if (command.data && command.data.description) {
                console.log(`"${command.data.description}":`);
            } else {
                console.warn(`⚠️  La commande "${file}" n'a pas de description ou de nom.`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de "${file}":`, error.message);
        }
    }
}

listCommandDescriptions().catch(console.error);
