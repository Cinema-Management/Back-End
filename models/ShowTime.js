const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showtimeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    movieCode: {
      type: String,
      ref: "Movie",
      required: true,
    },
    roomCode: {
      type: String,
      ref: "Room",
      required: true,
    },
    codeSubtitle: {
      type: String,
      ref: "Subtitle",
      required: false,
    },
    codeDub: {
      type: String,
      ref: "Dub",
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Showtime = mongoose.model("Showtime", showtimeSchema);
module.exports = Showtime;
