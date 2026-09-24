const express = require("express");
const { StatusCodes } = require("http-status-codes");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const router = new express.Router();

//post a new soldier
router.post("/", async (req, res) => {
  const soldier = new Soldier(req.body);

  try {
    if (soldier.team) {
      const team = await Team.findById(soldier.team);
      if (!team) {
        return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
      }
    }

    await soldier.save();
    res.status(StatusCodes.CREATED).send(soldier);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error);
  }
});

//get all of the soldiers
router.get("/", async (req, res) => {
  try {
    const soldiers = await Soldier.find({});

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//update a soldier's info
router.patch("/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "rank", "team"];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(StatusCodes.BAD_REQUEST).send({ error: "Invalid updates" });
  }

  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
    }

    updates.forEach((update) => (soldier[update] = req.body[update]));

    if (updates.includes('team')) {
      const team = await Team.findById(soldier.team);
      if (!team) {
        return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
      }
    }

    await soldier.save();
    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    } else if (error.name === "ValidationError") {
      return res.status(StatusCodes.BAD_REQUEST).send({ error });
    }

    res.status(StatusCodes.BAD_REQUEST).send(error);
  }
});

//delete soldier by id
router.delete("/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
    }

    await soldier.deleteOne()
    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get a team by soldier id
router.get("/:soldierid/team", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.soldierid);

    if (!soldier) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
    }

    if (!soldier.team) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No team listed to this soldier" });
    }

    const team = await Team.findById(soldier.team);
    res.send(team);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

//get a soldier by id
router.get("/:id", async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
    }

    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

module.exports = router;
