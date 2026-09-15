const express = require("express");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const router = new express.Router();

//delete a team and everyone in it?
//ask what is meant to happen

//update team info
router.patch("/teams/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "commander"]; //take care of updating commander by ref and soldiers with virtual thing. also add fields if they do not exist.
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send("No team with this id");
    }

    updates.forEach((update) => (team[update] = req.body[update]));

    await team.populate("commander");
    await team.save();
    res.send(team);
  } catch (error) {
    console.log(error);
    if (error.name === "CastError") {
      return res.status(404).send("No team with this id");
    }
    res.status(500).send();
  }
});

//post new team
router.post("/teams", async (req, res) => {
  const team = new Team(req.body);
  console.log(team._id);

  try {
    await team.populate("commander");
    await team.save();
    res.status(201).send(team);
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
});

//get team by id
router.get("/teams/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send("No team with this id");
    }

    await team.populate("commander");

    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send("No team with this id");
    }

    console.log(error);
    res.status(500).send();
  }
});

//get all the teams
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.find({});

    if (teams.length === 0) {
      return res.send("No teams yet, add a team first.");
    }

    //why does this not work?
    // teams.forEach(async (team) => {
    //   await team.populate("commander");
    // });

    //and this does work...
    for (const team of teams) {
      await team.populate("soldiers");
      await team.populate("commander");
    }

    res.send(teams);
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

//get commander by team id
router.get("/teams/commander/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send("No team with this id");
    }

    if (!team.commander) {
      return res.status(404).send("No commander listed to this team");
    }

    await team.populate("commander");

    res.send(team.commander);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send("No team with this id");
    }

    console.log(error);
    res.status(500).send();
  }
});

//get soldier amount in team by team id
router.get("/teams/soldiers/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send("No team with this id");
    }

    await team.populate("soldiers");
    //here get the virtual property and count it
    const soldierAmount = team.soldiers.length;
    res.send(soldierAmount);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send("No team with this id");
    }

    console.log(error);
    res.status(500).send();
  }
});

//get soldiers in team by team name
router.get("/teams/soldiersinfo/:name", async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.name });
    if (!team) {
      return res.status(404).send("No team with this name");
    }

    await team.populate("soldiers");

    if (team.soldiers.length === 0) {
      return res.send("No soldiers in this team yet");
    }

    res.send(team.soldiers);
  } catch (error) {
    console.log(error)
    if (error.name === "CastError") {
      return res.status(404).send("No team with this name");
    }

    res.status(500).send();
  }
});

module.exports = router;
