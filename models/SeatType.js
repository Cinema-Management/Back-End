const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const seatTypeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const SeatType = mongoose.model("SeatType", seatTypeSchema);
module.exports = SeatType;
