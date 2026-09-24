const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const Soldier = require("../models/soldier");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_STRING);
    const soldier = await Soldier.findOne({ _id: decoded._id, "tokens.token": token });
    
    if (!soldier) {
      throw new Error();
    }

    req.token = token;
    req.soldier = soldier;
    next();
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.UNAUTHORIZED).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
