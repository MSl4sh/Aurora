const mongoose = require('mongoose');

module.exports = {
    connectToDatabase: async () => {
        const uri = process.env.MONGODB_URI;

        try {
            await mongoose.connect(uri); // Aucune option obsolète
            console.log('✅ Connecté à la base de données MongoDB');
        } catch (error) {
            console.error('❌ Erreur de connexion à MongoDB :', error);
            process.exit(1);
        }
    },
};
