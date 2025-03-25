const mongoose = require("mongoose");

const { v4: uuidv4 } = require("uuid");

const warnSchema = new mongoose.Schema({
  caseId: { type: String, required: true, default: () => uuidv4(), unique: false }, // ID unique généré
  reason: { type: String, default: "Aucune raison spécifiée" }, // Raison du warning
  moderator: { type: String, required: true }, // Modérateur ayant donné le warning
  date: { type: Date, default: Date.now }, // Date du warning
});

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true }, // ID unique du serveur
  guildName: { type: String, required: true }, // Nom du serveur
  config: { type: mongoose.Schema.Types.ObjectId, ref: "ServerConfig" }, // Référence vers la config
  warnings: {
    type: [
      {
        userId: { type: String, required: true }, // ID de l'utilisateur
        warns: { type: [warnSchema]}, // Liste des warnings
      },
    ],
    default: [], // Par défaut, warnings est un tableau vide
  },
  joinDate: { type: Date, default: Date.now }, // Date de l'ajout du bot au serveur
});


module.exports = mongoose.model("Server", serverSchema);
