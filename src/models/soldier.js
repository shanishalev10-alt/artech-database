const mongoose = require("mongoose");
const Team = require("./team")

const soldierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rank: {
    type: String,
    enum: ["טוראי", "רבט", "סמל", "סמר", "סגם", "סגן", "סרן", "רסן"],
    trim: true,
    default: "טוראי"
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }
});

soldierSchema.pre("deleteOne", { query: false, document: true }, async function () {
  const soldier = this;

  //also check if they are a commander and delete from team document
  await Team.findOneAndUpdate({ commander: soldier._id }, { $unset: { commander: soldier._id } });
});

const Soldier = mongoose.model("Soldier", soldierSchema);

module.exports = Soldier;
