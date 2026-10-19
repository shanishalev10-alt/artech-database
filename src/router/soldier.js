const express = require("express");
const { StatusCodes } = require("http-status-codes");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = new express.Router();

const ASC_NUMBER = 1;
const DESC_NUMBER = -1;
const DOC_AMOUNT_TO_GET = 5;
const ONE_YEAR = 1;

//post a new soldier
router.post("", auth, isTeamLeader, async (req, res) => {
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
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

//log in soldier
router.post("/login", async (req, res) => {
  try {
    const soldier = await Soldier.findByCredentials(req.body.personalNumber, req.body.password);
    const token = await soldier.generateAuthToken();

    res.send({ soldier, token });
  } catch (error) {
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
// GET /soldiers?sortBy=asc
//get all the soldiers by order of pazam
router.get("", auth, async (req, res) => {
  const sort = {};

  if (req.query.sortBy) {
    sort.enlistmentDate = req.query.sortBy === "desc" ? DESC_NUMBER : ASC_NUMBER;
  }

  try {
    const soldiers = await Soldier.find({}).sort(sort);

    if (soldiers.length === 0) {
      return res.send("No soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get all soldiers who are not commanders
router.get("/simpleSoldier", auth, async (req, res) => {
  try {
    //Option 1 with aggregate
    const soldiers = await Soldier.aggregate([
      //add the team field if the soldier is a commander
      { $lookup: { from: "teams", localField: "_id", foreignField: "commander", as: "commander" } },
      //get only the soldiers that do not have the commander field filled
      { $match: { "commander._id": { $exists: false } } },
      //only get the name field
      {
        $project: {
          name: "$name",
          _id: false
        }
      }
    ]);

    if (soldiers.length === 0) {
      return res.send("No simple soldiers yet, add a soldier and try again.");
    }

    const soldiersNames = soldiers.map((soldierObject) => soldierObject.name);

    res.send(soldiersNames);

    // Option 2 with find and filter
    // const soldiers = await Soldier.find();
    // const idsOfCommanders = (await Team.find({ commander: { $exists: true } })).map((team) =>
    //   team.commander.valueOf()
    // );
    // const simpleSoldier = await Soldier.find({_id: {$nin: idsOfCommanders}})

    // if (soldiers.length === 0) {
    //   return res.send("No simple soldiers yet, add a soldier and try again.");
    // }

    // const soldiersNames = simpleSoldier.map((soldier) => soldier.name);

    // res.send(soldiersNames);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//get all soldiers who are enlisted less then a year in groups of five
router.get("/newSoldiers", auth, async (req, res) => {
  //claculate the soldiers pazam and find by only less then a year
  try {
    const date = new Date();
    const soldiers = await Soldier.find({
      enlistmentDate: { $gte: date.setFullYear(date.getFullYear() - ONE_YEAR) }
    })
      .limit(DOC_AMOUNT_TO_GET)
      .skip(parseInt(req.query.skip));

    if (soldiers.length === 0) {
      return res.send("No new soldiers yet, add a soldier and try again.");
    }

    res.send(soldiers);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

// GET /soldiers/commandersByTeamSize?sortBy=asc
//get all commanders by order of their team size
router.get("/commandersByTeamSize", auth, async (req, res) => {
  let sortOrder = ASC_NUMBER; //default

  if (req.query.sortBy) {
    sortOrder = req.query.sortBy === "desc" ? DESC_NUMBER : ASC_NUMBER;
  }

  try {
    const teams = await Team.aggregate([
      //get only teams with commanders
      { $match: { commander: { $exists: true } } },
      //add a field that has an array of the soldiers in that team
      {
        $lookup: {
          from: "soldiers",
          localField: "_id",
          foreignField: "team",
          as: "soldiersInTeam"
        }
      },
      //construct the returning fields and add a field of the size of the soldiers array
      {
        $project: {
          _id: "$_id",
          commander: "$commander",
          soldierAmount: { $size: "$soldiersInTeam" }
        }
      },
      //add the info of the commander
      {
        $lookup: {
          from: "soldiers",
          localField: "commander",
          foreignField: "_id",
          as: "commander"
        }
        //add the sorting requested by the route
      },
      { $sort: { soldierAmount: sortOrder } },
      //remove sensitive fields
      { $project: { "commander.tokens": false, "commander.password": false } },
      //extract the commander object from the array
      { $unwind: "$commander" }
    ]);

    if (teams.length === 0) {
      res.send("No teams with commanders yet. Add a team and then try again.");
    }

    const commandersSorted = teams.map((team) => team.commander);

    res.send(commandersSorted);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: error.message });
  }
});

//update a soldier's info
router.patch("/:id", auth, isTeamLeader, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "rank", "team", "enlistmentDate"];
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
