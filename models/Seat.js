const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeatSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    seatTypeCode: {
      type: String,
      ref: "SeatType",
      required: true,
    },
    roomCode: {
      type: String,
      ref: "Room",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },

    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

const Seat = mongoose.model("Seat", SeatSchema);
module.exports = Seat;
