const mongoose = require("mongoose");

mongoose.connect(
  process.env.MONGOOSE_API_STRING,
  {},
);

