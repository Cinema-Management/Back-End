const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const MovieSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    movieGenreCode: [{ type: String, ref: "MovieGenre" }],
    name: { type: String, required: true },
    image: { type: String, required: false },
    duration: { type: Number, required: false },
    ageRestriction: { type: Number, required: false },
    description: { type: String, required: false },
    trailer: { type: String, required: false },
    director: { type: String, required: false },
    cast: { type: String, required: false },
    country: { type: String, required: false },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    status: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Add plugins

MovieSchema.plugin(AutoIncrement, { inc_field: "movieId" });

MovieSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Movie = mongoose.model("Movie", MovieSchema);
module.exports = Movie;
