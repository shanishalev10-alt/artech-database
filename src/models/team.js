const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  commander: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Soldier"
  },
  // soldiers: {
  //   type: [
  //     {
  //       type: mongoose.Schema.Types.ObjectId,
  //       required: true,
  //       ref: "Soldier"
  //     }
  //   ]
  // }
});

// teamSchema.virtual("soldiers", {
//   ref: "Soldier",
//   localField: "_id",
//   foreignField: "team" 
// });

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
