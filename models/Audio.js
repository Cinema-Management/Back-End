const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const AudioSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);
//add plugins
AudioSchema.plugin(AutoIncrement, { inc_field: "audioId" });
AudioSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Audio = mongoose.model("Audio", AudioSchema);

module.exports = Audio;
