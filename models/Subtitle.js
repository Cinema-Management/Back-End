const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const SubtitleSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
//add plugins
SubtitleSchema.plugin(AutoIncrement, { inc_field: "subtitleId" });
SubtitleSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Subtitle = mongoose.model("Subtitle", SubtitleSchema);
module.exports = Subtitle;
