module.exports = (user) => {
    if (!user) {
        console.error('Utilisateur non valide.');
        return false;
    }

    if (user.bot) {
        return true;
    }

    return false;
};
