const express = require("express");
require("./db/mongoose");
const soldierRouter = require("./router/soldier");
const teamRouter = require("./router/team");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(soldierRouter);
app.use(teamRouter);

app.listen(port, () => {
  console.log("Server is up on port", port);
});
