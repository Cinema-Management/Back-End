const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    genres_code: [
      {
        type: String,
        ref: "MovieGenre",
      },
    ],
    name: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: false,
    },
    ageRestriction: {
      type: Number,
      required: false,
    },
    duration: {
      type: Number,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    trailer: {
      type: String,
      required: false,
    },

    director: {
      type: String,
      required: false,
    },
    cast: {
      type: String,
      required: false,
    },

    country: {
      type: String,
      required: false,
    },
    rated: {
      type: Number,
      required: false,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },

    status: {
      // 0: inactive, 1: active
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
