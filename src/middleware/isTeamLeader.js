const { StatusCodes } = require("http-status-codes");
const Soldier = require("../models/soldier")

const isTeamLeader = async (req, res, next) => {
  try {
    if (!req.soldier.isCommander) {
      throw new Error();
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.UNAUTHORIZED).send({ error: "Only commanders have access" });
  }
};

module.exports = isTeamLeader;
