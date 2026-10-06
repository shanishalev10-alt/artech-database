const express = require("express");
const { StatusCodes } = require("http-status-codes");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = new express.Router();

//post new team
router.post("/", auth, isTeamLeader, async (req, res) => {
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
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

//get all the teams
router.get("/", auth, async (req, res) => {
  try {
    const teams = await Team.find({});

    if (teams.length === 0) {
      return res.send("No teams yet, add a team first.");
    }

    res.send(teams);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//update team info
router.patch("/:id", auth, isTeamLeader, async (req, res) => {
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
      return res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//delete a team
router.delete("/:id", auth, isTeamLeader, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    await team.deleteOne();
    await Soldier.updateMany({team: team._id}, {$unset: {team: team._id}})

    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get commander by team id
router.get("/:id/commander", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    if (!team.commander) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No commander listed to this team" });
    }

    const commander = await Soldier.findById(team.commander);
    res.send(commander);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get soldier amount in team by team id
router.get("/:teamId/soldiersAmount", auth, async (req, res) => {
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

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get soldiers in team by team name
router.get("/:teamName/soldiersInfo", auth, async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.teamName });

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this name" });
    }

    const soldiers = await Soldier.find({ team: team._id });

    if (soldiers.length === 0) {
      return res.send( "No soldiers in this team yet" );
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get team by id
router.get("/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
    }

    res.send(team);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

module.exports = router;
