
module.exports = {
    name: 'ready', // Nom de l'événement
    once: true, // Indique que l'événement ne doit être déclenché qu'une seule fois
    execute(client) {
        console.log(`Bot prêt ! Connecté en tant que ${client.user.tag}`);
    },
};