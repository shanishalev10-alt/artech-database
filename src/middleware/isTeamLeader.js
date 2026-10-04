const { StatusCodes } = require("http-status-codes");
const Team = require("../models/team")

const isTeamLeader = async (req, res, next) => {
  try {
    const commanderTeam = await Team.find({commander: req.soldier._id})
    if (commanderTeam.length === 0) {
      throw new Error();
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.UNAUTHORIZED).send({ error: "Only commanders have access" });
  }
};

module.exports = isTeamLeader;
