const mongoose = require("mongoose");

const Soldier = mongoose.model("Soldier", {
  name: { type: String, required: true, trim: true },
  rank: { type: String, trim: true, default: "Torai" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }
});

module.exports = Soldier;
