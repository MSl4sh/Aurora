const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const colorTable = require("../utils/colorTable")
const hasChannelPermissions = require("../utils/checkBotPermissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-inactives")
    .setDescription(
      "Check for inactive members who have not sent a message in the last 30 days."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction, server) {
    const config = server.config;

    await interaction.deferReply({ ephemeral: true });

    const cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes

    try {


      
      const useTranslate = require("../i18n");
      const { t } = useTranslate(server.config.guildLanguage==='en'? "en":"");
      const members = await interaction.guild.members.fetch(); // Récupère tous les membres
      const textChannels = interaction.guild.channels.cache.filter((channel) =>
        channel.isTextBased()
      );
      const inactiveMembers = [];
      const lastMessages = new Map(); // Stocke la date du dernier message pour chaque utilisateur

      // Récupérer la date du dernier message pour chaque utilisateur
      for (const [channelId, channel] of textChannels) {
        const messages = await channel.messages.fetch({ limit: 100 });
        for (const [messageId, message] of messages) {
          const userId = message.author.id;

          // Stocke la date du dernier message
          if (
            !lastMessages.has(userId) ||
            lastMessages.get(userId) < message.createdTimestamp
          ) {
            lastMessages.set(userId, message.createdTimestamp);
          }
        }
      }

      // Détection des membres inactifs
      for (const [id, member] of members) {
        if (
          member.user.bot || // Ignore les bots
          member.id === interaction.user.id || // Exclut l'utilisateur exécutant la commande
          member.permissions.has(PermissionFlagsBits.Administrator) || // Exclut les administrateurs
          member.permissions.has(PermissionFlagsBits.ManageMessages) // Exclut les modérateurs
        ) {
          continue;
        }

        const lastMessageTimestamp = lastMessages.get(id) || 0; // Si pas de message, considère comme inactif
        if (lastMessageTimestamp === 0 || lastMessageTimestamp < cutoffDate) {
          inactiveMembers.push({
            id: member.id,
            tag: member.user.tag,
            displayName: member.displayName,
            lastMessage: lastMessageTimestamp
              ? `<t:${Math.floor(lastMessageTimestamp / 1000)}:R>`
              : `${t("Aucun message")}`,
          });
        }
      }

      if (inactiveMembers.length === 0) {
        return interaction.followUp({
          content: `✅ ${t("Aucun membre inactif trouvé.")}`,
          ephemeral: true,
        });
      }

      // Pagination
      let currentPage = 0;
      const pageSize = 10;

      const renderEmbed = () => {
        const start = currentPage * pageSize;
        const end = start + pageSize;
        const pageItems = inactiveMembers.slice(start, end);

        const embed = new EmbedBuilder()
          .setColor(colorTable.warning)
          .setTitle(`🧹${t("Membres inactifs (30j)")}`)
          .setDescription(
            pageItems
              .map(
                (m, i) =>
                  `**${start + i + 1}.** ${m.displayName} (${m.tag}) - ${t(
                    "Dernier message"
                  )} ${m.lastMessage}`
              )
              .join("\n")
          )
          .setFooter({
            text: `Page ${currentPage + 1}/${Math.ceil(
              inactiveMembers.length / pageSize
            )} | Total : ${inactiveMembers.length} ${t("membres")}`,
          })
          .setTimestamp();

        return embed;
      };

      const renderButtons = () => {
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("clean_inactives")
            .setLabel(`🧹 ${t("Expulser les inactifs")}`)
            .setStyle(ButtonStyle.Danger)
        );

        if (inactiveMembers.length > pageSize) {
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId("prev_page")
              .setLabel(`⬅️ ${t("Précédent")}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId("next_page")
              .setLabel(`➡️ ${t("Suivant")}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(
                currentPage >= Math.ceil(inactiveMembers.length / pageSize) - 1
              )
          );
        }

        return buttons;
      };

      const message = await interaction.followUp({
        embeds: [renderEmbed()],
        components: [renderButtons()],
        ephemeral: true,
      });

      const collector = message.createMessageComponentCollector({
        time: 600000, // 10 minutes
      });

      collector.on("collect", async (btnInteraction) => {
        if (btnInteraction.user.id !== interaction.user.id) {
          return btnInteraction.reply({
            content: `❌ ${t(
              "Seul l'utilisateur ayant exécuté la commande peut interagir avec les boutons."
            )}`,
            ephemeral: true,
          });
        }

        switch (btnInteraction.customId) {
          case "prev_page":
            currentPage--;
            await btnInteraction.update({
              embeds: [renderEmbed()],
              components: [renderButtons()],
            });
            break;

          case "next_page":
            currentPage++;
            await btnInteraction.update({
              embeds: [renderEmbed()],
              components: [renderButtons()],
            });
            break;

          case "clean_inactives":
            const confirmationEmbed = new EmbedBuilder()
              .setColor(colorTable.danger)
              .setTitle(`🧹 ${t("Expulser les membres inactifs")}`)
              .setDescription(
                `${t(
                  "Êtes-vous sûr de vouloir expulser tous les membres inactifs ?"
                )}`
              )
              .setTimestamp();

            const confirmationButtons = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("confirm_clean")
                .setLabel("Oui")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("cancel_clean")
                .setLabel("Non")
                .setStyle(ButtonStyle.Secondary)
            );

            await btnInteraction.reply({
              embeds: [confirmationEmbed],
              components: [confirmationButtons],
              ephemeral: true,
            });

            const filter = (i) =>
              i.user.id === interaction.user.id &&
              ["confirm_clean", "cancel_clean"].includes(i.customId);

            const confirmationCollector =
              btnInteraction.channel.createMessageComponentCollector({
                filter,
                time: 30000, // 30 secondes
                max: 1,
              });

            confirmationCollector.on(
              "collect",
              async (confirmationInteraction) => {
                if (confirmationInteraction.customId === "confirm_clean") {
                  const expelledMembers = [];
                  try {
                    if (
                      !interaction.guild.members.me.permissions.has(
                        PermissionFlagsBits.KickMembers
                      )
                    ) {
                      return interaction.followUp({
                        content: `❌ ${t(
                          "Je n'ai pas la permission d'expulser des membres. Veuillez vérifier mes permissions."
                        )}`,
                        ephemeral: true,
                      });
                    }
                    for (const member of inactiveMembers) {
                      const target = await interaction.guild.members.fetch(
                        member.id
                      );
                      await target.kick(
                        `${t(
                          "Expulsé pour inactivité (30 jours sans message)"
                        )}`
                      );
                      expelledMembers.push(member.displayName);
                    }

                    const logEmbed = new EmbedBuilder()
                      .setColor(colorTable.info)
                      .setTitle(`🧹 ${t("Expulsion des membres inactifs")}`)
                      .setDescription(
                        `${t(
                          "Les membres inactifs suivants ont été expulsés :"
                        )}`
                      )
                      .addFields({
                        name: `${t("Membres expulsés")}`,
                        value: expelledMembers.join(", ") || `${t("Aucun")}`,
                      })
                      .setTimestamp();

                    const logsChannel = interaction.guild.channels.cache.find(
                      (channel) => channel.id === config.moderationLogsChannel
                    );

                    if (!hasChannelPermissions(logsChannel)) {
                      return interaction.reply({
                          content: "🚫 Je n'ai pas les permissions nécessaires pour envoyer des messages dans le canal {logs}.".replace('{logs}', logsChannel),
                          ephemeral: true
                      });
                  }

                    if (logsChannel) {
                      await logsChannel.send({ embeds: [logEmbed] });
                    }

                    await confirmationInteraction.reply({
                      content: `✅ ${t(
                        "Les membres inactifs ont été expulsés avec succès."
                      )}`,
                      ephemeral: true,
                    });
                  } catch (error) {
                    console.error(
                      "Erreur lors de l'expulsion des membres inactifs :",
                      error
                    );
                    await confirmationInteraction.reply({
                      content: `❌ ${t(
                        "Une erreur s'est produite lors de l'expulsion des membres inactifs."
                      )}`,
                      ephemeral: true,
                    });
                  }
                } else if (
                  confirmationInteraction.customId === "cancel_clean"
                ) {
                  await confirmationInteraction.reply({
                    content: `❌ ${t("Nettoyage annulé.")}`,
                    ephemeral: true,
                  });
                }
              }
            );

            confirmationCollector.on("end", async (_, reason) => {
              if (reason === "time") {
                await btnInteraction.followUp({
                  content: `❌ ${t("Temps écoulé. Nettoyage annulé.")}`,
                  ephemeral: true,
                });
              }
            });
            break;
        }
      });

      collector.on("end", async () => {
     
        try {

          if (message.editable) {
            await message.edit({
              components: [], // Désactive les boutons après expiration
            });
          }
        } catch (error) {
          console.error("Erreur lors de la désactivation des boutons :", error);
        }
      });
    } catch (error) {
      console.error("Erreur lors de la vérification de l'activité :", error);
      interaction.followUp({
        content: `❌ ${t(
          "Une erreur s'est produite lors de la vérification de l'activité des membres."
        )}`,
        ephemeral: true,
      });
    }
  },
};
