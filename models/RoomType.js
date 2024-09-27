const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const RoomTypeSchema = new Schema(
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
  { timestamps: true, collection: "room_types" }
);
// Add plugins
RoomTypeSchema.plugin(AutoIncrement, { inc_field: "roomTypeId" });

RoomTypeSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const RoomType = mongoose.model("RoomType", RoomTypeSchema);

module.exports = RoomType;
