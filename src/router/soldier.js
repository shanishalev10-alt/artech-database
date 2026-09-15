const express = require("express");
const Soldier = require("../models/soldier");
const router = new express.Router();

//delete soldier by id
router.delete("/soldiers/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findByIdAndDelete(req.params.id);

    if (!soldier) {
      return res.status(404).send("No soldier with this id");
    }

    res.send(soldier);
  } catch (error) {
    console.log(error)
    res.status(500).send();
  }
});

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

    await soldier.populate("team");

    await soldier.save();

    res.send(soldier);
  } catch (error) {
    console.log(error);
    if (error.name === "CastError") {
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
  } catch (error) {
    console.log(error);
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
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send(error);
    }
    console.log(error);
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
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

//get a team by soldier id
router.get("/soldiers/team/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(404).send("No soldier with this id");
    }

    if (!soldier.team) {
      return res.status(404).send("No team listed to this soldier");
    }

    await soldier.populate("team");
    await soldier.team.populate("commander");

    res.send(soldier.team);
  } catch (error) {
    console.log(e);
    return res.status(500).send();
  }
});

module.exports = router;
