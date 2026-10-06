const mongoose = require("mongoose");
const Soldier = require("./soldier");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  commander: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Soldier"
  }
});

teamSchema.pre("save", async function () {
  const team = this;
  if (team.isModified("commander")) {
    await Soldier.findByIdAndUpdate(team.commander, { isCommander: true });
  }
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
