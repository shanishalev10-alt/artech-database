const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Team = require("./team");

const soldierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  personalNumber: {
    type: Number,
    validate(value) {
      if (value.toString().length !== 7) {
        throw new Error("Personal number should be a 7 digit number.");
      }
    },
    required: true,
    unique: true
  },
  rank: {
    type: String,
    enum: ["טוראי", "רבט", "סמל", "סמר", "סגם", "סגן", "סרן", "רסן"],
    trim: true,
    default: "טוראי"
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  password: {
    type: String,
    required: true,
    minLength: 7
  },
  isCommander: { type: Boolean, default: false },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  enlistmentDate: {
    type: Date,
    required: true
  }
});

soldierSchema.pre("deleteOne", { query: false, document: true }, async function () {
  const soldier = this;

  //also check if they are a commander and delete from team document
  await Team.findOneAndUpdate({ commander: soldier._id }, { $unset: { commander: soldier._id } });
});

soldierSchema.methods.generateAuthToken = async function () {
  const soldier = this;
  const token = jwt.sign({ _id: soldier._id.toString() }, process.env.JWT_STRING);

  soldier.tokens = soldier.tokens.concat({ token });
  await soldier.save();

  return token;
};

soldierSchema.methods.toJSON = function () {
  const soldier = this;

  const soldierObject = soldier.toObject();
  delete soldierObject.password;
  delete soldierObject.tokens;

  return soldierObject;
};

soldierSchema.statics.findByCredentials = async (personalNumber, password) => {
  const soldier = await Soldier.findOne({ personalNumber });

  if (!soldier) {
    throw new Error("Unable to log in");
  }

  const isMatch = await bcrypt.compare(password, soldier.password);

  if (!isMatch) {
    throw new Error("Unable to log in");
  }

  return soldier;
};

soldierSchema.pre("save", async function () {
  const soldier = this;
  if (soldier.isModified("password")) {
    soldier.password = await bcrypt.hash(soldier.password, 8);
  }
});

const Soldier = mongoose.model("Soldier", soldierSchema);

module.exports = Soldier;
