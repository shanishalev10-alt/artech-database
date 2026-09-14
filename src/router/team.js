const express = require("express");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const router = new express.Router();

//delete a team and everyone in it

//update team info
router.patch("/teams/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "commander", "soldiers"]; //take care of updating commander by ref and soldiers with virtual thing. also add fields if they do not exist.
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

    addTeamIdToSoldier(team._id, req.body.soldiers, res);

    await team.populate("commander");
    await team.populate("soldiers");
    await team.save();
    res.send(team);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError") {
      return res.status(404).send("No team with this id");
    }
    res.status(500).send();
  }
});

const addTeamIdToSoldier = async (teamId, soldierIds, res) => {
  if (soldierIds) {
    try {
      for (const soldierId of soldierIds) {
        const soldier = await Soldier.findById(soldierId);
        if (!soldier) {
          return res.status(400).send("No soldier with that id.");
        }
        soldier.team = teamId;
        soldier.save();
      }
    } catch (e) {
      res.status(400).send();
    }
  }
};

//post new team
router.post("/teams", async (req, res) => {
  const team = new Team(req.body);
  console.log(team._id);

  try {
    addTeamIdToSoldier(team._id, team.soldiers, res);

    await team.populate("commander");
    await team.populate("soldiers");
    await team.save();
    res.status(201).send(team);
  } catch (e) {
    console.log(e);
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
    await team.populate("soldiers");

    res.send(team);
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(404).send("No team with this id");
    }

    console.log(e);
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
    //   await team.populate("soldiers");
    // });

    //and this does work...
    for (const team of teams) {
      await team.populate("commander");
      await team.populate("soldiers");
    }

    res.send(teams);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//get commander by team id
//get soldier number by team id

module.exports = router;
