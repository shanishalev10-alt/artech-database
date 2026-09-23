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
  await Soldier.updateMany({ team: team._id }, { $unset: { team: team._id } });
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
