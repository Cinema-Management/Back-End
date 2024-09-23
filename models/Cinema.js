const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const CinemaSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    hierarchyValueCode: { type: String, ref: "HierarchyValue" },
    status: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Add plugins
CinemaSchema.plugin(AutoIncrement, { inc_field: "cinemaId" });

CinemaSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Cinema = mongoose.model("Cinema", CinemaSchema);
module.exports = Cinema;
