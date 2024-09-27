const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const RoomSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    roomTypeCode: [
      {
        type: String,
        ref: "RoomType",
        trim: true,
      },
    ],
    cinemaCode: {
      type: String,
      ref: "Cinema",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    numRows: {
      type: Number,
      required: true,
      min: 1,
    },

    numColumns: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

RoomSchema.plugin(AutoIncrement, { inc_field: "roomId" });

RoomSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
