const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const colorTable = require("../utils/colorTable");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Display all available commands."),

  async execute(interaction, server) {
  

    try {
      
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage === "en" ? "en" : "");
      // Déférer la réponse pour éviter l'erreur de timeout
      await interaction.deferReply({ ephemeral: false });
      // Lire tous les fichiers de commandes
      const commandFiles = fs
        .readdirSync("./commands")
        .filter((file) => file.endsWith(".js"));

      // Catégoriser les commandes
      const moderationCommands = [];
      const publicCommands = [];

      for (const file of commandFiles) {
        const command = require(`../commands/${file}`);

        // Ignorer la commande "updatesannounce"
        if (command.data.name === "updatesannounce") continue;

        // Vérifier si la commande est de modération ou publique
        if (command.data.default_member_permissions) {
          moderationCommands.push({
            name: `/${command.data.name}`,
            description:
              t(command.data.description) || `${t("Aucune description")}`,
          });
        } else {
          publicCommands.push({
            name: `/${command.data.name}`,
            description:
              t(command.data.description) || `${t("Aucune description")}`,
          });
        }
      }

      // Diviser les commandes en plusieurs embeds si nécessaire
      const createEmbeds = (commands, title, color) => {
        const embeds = [];
        for (let i = 0; i < commands.length; i += 25) {
          const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .addFields(
              commands.slice(i, i + 25).map((cmd) => ({
                name: cmd.name,
                value: cmd.description,
              }))
            );
          embeds.push(embed);
        }
        return embeds;
      };

      const moderationEmbeds = createEmbeds(
        moderationCommands,
        `${t("Commandes d'administration")}`,
        colorTable.warning
      );
      const publicEmbeds = createEmbeds(
        publicCommands,
        `${t("Commandes publiques")}`,
        colorTable.info
      );

      if (
        !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)
      ) {
        // Envoyer les commandes publiques uniquement
        for (const embed of publicEmbeds) {
          await interaction.followUp({ embeds: [embed] });
        }
        return;
      }

      // Combiner les embeds pour modération et publics
      const allEmbeds = [...moderationEmbeds, ...publicEmbeds];

      // Envoyer le premier embed avec editReply
      await interaction.editReply({ embeds: [allEmbeds[0]] });

      // Envoyer les autres embeds via followUp
      for (let i = 1; i < allEmbeds.length; i++) {
        await interaction.followUp({ embeds: [allEmbeds[i]] });
      }
    } catch (error) {
      console.error("Erreur dans la commande /help :", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: `${t(
            "Une erreur s'est produite lors de l'exécution de la commande."
          )}`,
          ephemeral: true,
        });
      }
    }
  },
};
