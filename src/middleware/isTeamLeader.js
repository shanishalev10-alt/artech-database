const { StatusCodes } = require("http-status-codes");
const Team = require("../models/team")

const isTeamLeader = async (req, res, next) => {
  try {
    const commanderTeam = await Team.find({commander: req.soldier._id})
    
    if (commanderTeam.length === 0) {
      throw new Error("Only commanders have access");
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.UNAUTHORIZED).send({ error: error.message });
  }
};

module.exports = isTeamLeader;
