const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoomSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    roomTypeCode: {
      type: String,
      ref: "RoomType",
    },
    cinema_code: {
      type: String,
      ref: "Cinema",
    },
    name: {
      type: String,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
