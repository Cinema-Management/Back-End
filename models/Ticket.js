const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    showtimeCode: {
      type: String,
      ref: "Showtime",
      required: true,
    },
    seatCode: [
      {
        type: String,
        ref: "Seat",
        required: true,
      },
    ],
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
