const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const MovieGenreSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Add plugins

MovieGenreSchema.plugin(AutoIncrement, { inc_field: "movieGenreId" });

MovieGenreSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const MovieGenre = mongoose.model("MovieGenre", MovieGenreSchema);
module.exports = MovieGenre;
