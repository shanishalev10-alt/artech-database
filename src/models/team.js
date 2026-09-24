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

teamSchema.pre("deleteOne", { query: false, document: true }, async function () {
  const team = this;

  //delete team property for soldiers who were in this team
  await Soldier.updateMany({ team: team._id }, { $unset: { team: team._id } });//this does not work! // says updateMany is not a function
});[]

teamSchema.pre("save", async function () {
  const team = this;
  if (team.isModified("commander")) {
    await Soldier.findByIdAndUpdate(team.commander, {isCommander: true})//this does not work! //says findByIdAndUpdate is not a function
  }
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
