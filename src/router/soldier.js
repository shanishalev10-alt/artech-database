const express = require("express");
const Soldier = require("../models/soldier");
const router = new express.Router();

//delete soldier by id

const addSoldierIdToTeam = async (soldierId, teamId, res) => {
  if (teamId) {
    try {
      const team = await Soldier.findById(teamId);
      console.log(team)
      if (!team) {
        return res.status(400).send("No soldier with that id.");
      }

      if (!team.soldiers.includes(soldierId)) {
        team.soldiers.push(soldierId);
      }

      team.save();
    } catch (e) {
      res.status(400).send();
    }
  }
};

//update a soldier's info
router.patch("/soldiers/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "rank", "team"];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(404).send("No soldier with this id");
    }

    updates.forEach((update) => (soldier[update] = req.body[update]));

    addSoldierIdToTeam(soldier._id, soldier.team, res);

    await soldier.save();

    res.send(soldier);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError") {
      return res.status(404).send("No soldier with this id");
    }

    res.status(400).send();
  }
});

//post a new soldier
router.post("/soldiers", async (req, res) => {
  const soldier = new Soldier(req.body);

  try {
    await soldier.populate("team");
    await soldier.save();
    res.status(201).send(soldier);
  } catch (e) {
    console.log(e);
    res.status(400).send();
  }
});

//get a soldier by id
router.get("/soldiers/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);
    if (!soldier) {
      return res.status(404).send();
    }

    await soldier.populate("team");
    res.send(soldier);
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(404).send(e);
    }
    console.log(e);
    res.status(500).send();
  }
});

//get all of the soldiers
router.get("/soldiers", async (req, res) => {
  try {
    const soldiers = await Soldier.find({});

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//get a team by soldier

module.exports = router;
