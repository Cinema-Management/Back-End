const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MovieGenreSchema = new Schema(
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

const MovieGenre = mongoose.model("MovieGenre", MovieGenreSchema);
module.exports = MovieGenre;
