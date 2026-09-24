const express = require("express");
const { StatusCodes } = require("http-status-codes");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = new express.Router();

const ascNumber = 1;
const descNumber = -1;
const docAmountToGet = 5;

//post a new soldier
router.post("/postSoldier", auth, isTeamLeader, async (req, res) => {
  const soldier = new Soldier(req.body);

  try {
    if (soldier.team) {
      const team = await Team.findById(soldier.team);
      if (!team) {
        return res.status(StatusCodes.NOT_FOUND).send({ error: "No team with this id" });
      }
    }

    await soldier.save();
    const token = await soldier.generateAuthToken();

    res.status(StatusCodes.CREATED).send({ soldier, token });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

//log in soldier
router.post("/login", async (req, res) => {
  try {
    console.log("in here");
    const soldier = await Soldier.findByCredentials(req.body.personalNumber, req.body.password);
    const token = await soldier.generateAuthToken();

    res.send({ soldier, token });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

//log out soldier
router.post("/logout", auth, async (req, res) => {
  try {
    req.soldier.tokens = req.soldier.tokens.filter((token) => token.token !== req.token);
    await req.soldier.save();
    res.send();
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//log out all devices for soldier
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.soldier.tokens = [];
    await req.soldier.save();
    res.send();
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get all of the soldiers
router.get("/", auth, async (req, res) => {
  try {
    const soldiers = await Soldier.find({});

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get all soldiers who are not commanders
router.get("/notCommander", auth, async (req, res) => {
  try {
    const soldiers = await Soldier.find({ isCommander: false });

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    const filteredSoldiers = soldiers.map((soldier) => soldier.name);

    res.send(filteredSoldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get all soldiers who are enlisted less then a year in groups of five
router.get("/simpleSoldiers", auth, async (req, res) => {
  //claculate the soldiers pazam and find by only less then a year
  try {
    const soldiers = await Soldier.find({})
      .sort({ enlistmentDate: ascNumber })
      .limit(docAmountToGet)
      .skip(parseInt(req.query.skip));

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

// GET /soldiers/byPazam?sortBy=asc
//get all the soldiers by order of pazam
router.get("/byPazam", auth, async (req, res) => {
  const sort = {};

  if (req.query.sortBy) {
    sort.enlistmentDate = req.query.sortBy === "desc" ? descNumber : ascNumber;
  }

  try {
    const soldiers = await Soldier.find({}).sort(sort);
    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//update a soldier's info
router.patch("/:id", auth, isTeamLeader, async (req, res) => {
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

    if (updates.includes("team")) {
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
      return res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
    }

    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

//delete soldier by id
router.delete("/:id", auth, isTeamLeader, async (req, res) => {
  try {
    const soldier = await Soldier.findById(req.params.id);

    if (!soldier) {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "No soldier with this id" });
    }

    await soldier.deleteOne();
    res.send(soldier);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(StatusCodes.NOT_FOUND).send({ error: "Not a valid id!" });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get a team by soldier id
router.get("/:soldierid/team", auth, async (req, res) => {
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

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get a soldier by id
router.get("/:id", auth, async (req, res) => {
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

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

module.exports = router;
