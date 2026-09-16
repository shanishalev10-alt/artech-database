const express = require("express");
const Soldier = require("../models/soldier");
const router = new express.Router();

//post a new soldier
router.post("/soldiers", async (req, res) => {
  const soldier = new Soldier(req.body);

  try {
    await soldier.populate("team");
    if (soldier.team === null) {
      return res.status(404).send({ error: "No team with this id" });
    }

    await soldier.save();
    res.status(201).send(soldier);
  } catch (error) {
    res.status(400).send(error);
  }
});

//get a soldier by id
router.get("/soldiers/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    await soldier.populate("team");
    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    res.status(500).send(error);
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
    res.status(500).send(error);
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
      return res.status(404).send({ error: "No soldier with this id" });
    }

    updates.forEach((update) => (soldier[update] = req.body[update]));

    await soldier.populate("team");

    if (soldier.team === null) {
      return res.status(404).send({ error: "No team with this id" });
    }

    await soldier.save();
    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No soldier with this id" });
    } else if (error.name === "ValidationError") {
      return res.status(400).send({ error: "Make sure you change details to valid types" });
    }

    res.status(400).send(error);
  }
});

//delete soldier by id
router.delete("/soldiers/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findByIdAndDelete(req.params.id);

    if (!soldier) {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    res.status(500).send(error);
  }
});

//get a team by soldier id
router.get("/soldiers/team/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    if (!soldier.team) {
      return res.status(404).send({ error: "No team listed to this soldier" });
    }

    await soldier.populate("team");
    await soldier.team.populate("commander");

    res.send(soldier.team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ error: "No soldier with this id" });
    }

    return res.status(500).send(error);
  }
});

module.exports = router;
