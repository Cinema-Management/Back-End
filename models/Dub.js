const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DubSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Dub = mongoose.model("Dub", DubSchema);

module.exports = Dub;
