const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lucky-winner")
    .setDescription(
      "Selects a random winner from the reactions of a message."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("messageid")
        .setDescription("The ID of the message to select the winner from.")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where the message is located.")
        .setRequired(true)
    ),

  async execute(interaction, server) {
    const messageId = interaction.options.getString("messageid");
    const channel = interaction.options.getChannel("channel");


    try {
      if(!server.config.guildLanguage) {
        return interaction.reply({
          content: `❌ Aucune donnée trouvée pour ce serveur.`,
          ephemeral: true,
        });
      }

      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      // Vérifier si le salon est un salon texte
      if (!channel.isTextBased()) {
        return interaction.reply({
          content: `❌ ${t("Le salon spécifié n'est pas un salon texte.")}`,
          ephemeral: true,
        });
      }

      // Récupérer le message
      const message = await channel.messages.fetch(messageId);

      // Vérifier les réactions
      if (!message.reactions.cache.size) {
        return interaction.reply({
          content: `❌ ${t("Le message spécifié n'a pas de réactions.")}`,
          ephemeral: true,
        });
      }

      // Récupérer les utilisateurs ayant réagi
      const reactionUsers = [];
      for (const reaction of message.reactions.cache.values()) {
        const users = await reaction.users.fetch();
        users.each((user) => {
          if (!user.bot) reactionUsers.push(user);
        });
      }

      // Vérifier si des utilisateurs sont éligibles
      if (!reactionUsers.length) {
        return interaction.reply({
          content: `❌ ${t(
            "Aucun utilisateur éligible pour le tirage au sort."
          )}`,
          ephemeral: true,
        });
      }

      // Sélectionner un gagnant aléatoire
      const winner =
        reactionUsers[Math.floor(Math.random() * reactionUsers.length)];

      // Créer un embed pour annoncer le gagnant
      const embed = new EmbedBuilder()
        .setTitle("🎉 Lucky Winner 🎉")
        .setDescription(`${t("Le gagnant du tirage au sort est :")} <@${winner}>`)
        .setColor("Gold")
        .setTimestamp();

      // Répondre à la commande
      await interaction.reply({
        embeds: [embed],
      });

      // Mentionner le gagnant dans le salon
      await channel.send({
        content: `🎉${t("Félicitations à")} ${winner} ${t(
          "pour avoir gagné le tirage au sort !"
        )}`,
      });
    } catch (error) {
      console.error("Erreur lors de la commande luckywinner :", error);
      interaction.reply({
        content: `❌ ${t(
          "Une erreur est survenue lors de la sélection du gagnant."
        )}`,
        ephemeral: true,
      });
    }
  },
};
