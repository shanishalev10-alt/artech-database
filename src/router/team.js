const express = require("express");
const { StatusCodes } = require("http-status-codes");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const router = new express.Router();

//post new team
router.post("/", async (req, res) => {
  const team = new Team(req.body);

  try {
    if (team.commander) {
      const commander = await Soldier.findById(team.commander);
      if (!commander) {
        return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
      }
    }

    await team.save();
    res.status(StatusCodes.CREATED).send(team);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error);
  }
});

//get all the teams
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find({});

    if (teams.length === 0) {
      return res.send("No teams yet, add a team first.");
    }

    res.send(teams);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//update team info
router.patch("/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "commander"];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({ error: "Invalid updates" });
  }

  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    updates.forEach((update) => (team[update] = req.body[update]));

    await team.save();
    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    } else if (error.name === "ValidationError") {
      return res.status(StatusCodes.BAD_REQUEST).send({ error });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//delete a team
router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    await team.deleteOne();

    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get commander by team id
router.get("/commander/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    if (!team.commander) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No commander listed to this team" });
    }

    const commander = Soldier.findById(team.commander);
    res.send(commander);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get soldier amount in team by team id
router.get("/:teamId/soldiersAmount", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    const soldierNum = await Soldier.countDocuments({ team: team._id });
    res.send(soldierNum);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get soldiers in team by team name
router.get("/:teamName/soldiersInfo", async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.teamName });

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this name" });
    }

    const soldiers = await Soldier.find({ team: team._id });

    if (soldiers.length === 0) {
      return res.send({ error: "No soldiers in this team yet" });
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get team by id
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    res.send(team);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

module.exports = router;
