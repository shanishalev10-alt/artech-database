const express = require("express");
const Team = require("../models/team");
const Soldier = require("../models/soldier");

//post new team
router.post("/teams", async (req, res) => {
  const team = new Team(req.body);

  try {
    await team.populate("commander");

    if (team.commander === null) {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    await team.save();
    res.status(201).send(team);
  } catch (error) {
    res.status(400).send(error);
  }
});

//get team by id
router.get("/teams/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "No team with this id" });
    }

    await team.populate("commander");

    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No team with this id" });
    }

    res.status(500).send(error);
  }
});

//get all the teams
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.find({});

    if (teams.length === 0) {
      return res.send("No teams yet, add a team first.");
    }

    for (const team of teams) {
      await team.populate("soldiers");
      await team.populate("commander");
    }

    res.send(teams);
  } catch (error) {
    res.status(500).send(error);
  }
});
const router = new express.Router();

//update team info
router.patch("/teams/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "commander"];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "No team with this id" });
    }

    updates.forEach((update) => (team[update] = req.body[update]));

    await team.populate("commander");
    await team.save();
    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No team with this id" });
    } else if (error.name === "ValidationError") {
      return res.status(400).send({ error: "Make sure you change details to valid types" });
    }

    res.status(500).send(error);
  }
});

//delete a team
router.delete("/teams/:id", async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "No team with this id" });
    }

    //delete team property for soldiers who were in this team
    await Soldier.updateMany({ team: team._id }, { $unset: { team: team._id } });

    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No team with this id" });
    }

    res.status(500).send(error);
  }
});

//get commander by team id
router.get("/teams/commander/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "No team with this id" });
    }

    if (!team.commander) {
      return res.status(404).send({ error: "No commander listed to this team" });
    }

    await team.populate("commander");

    res.send(team.commander);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No team with this id" });
    }

    res.status(500).send(error);
  }
});

//get soldier amount in team by team id
router.get("/teams/soldiers/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "No team with this id" });
    }

    await team.populate("soldiers");

    const soldierAmount = team.soldiers.length;
    res.send(soldierAmount);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No team with this id" });
    }

    res.status(500).send(error);
  }
});

//get soldiers in team by team name
router.get("/teams/soldiersinfo/:name", async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.name });

    if (!team) {
      return res.status(404).send({ error: "No team with this name" });
    }

    await team.populate("soldiers");

    if (team.soldiers.length === 0) {
      return res.send({ error: "No soldiers in this team yet" });
    }

    res.send(team.soldiers);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
