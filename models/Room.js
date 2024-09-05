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
    cinemaCode: {
      type: String,
      ref: "Cinema",
    },
    name: {
      type: String,
      required: true,
    },
    quantityColum: {
      type: Number,
      required: true,
      default: 1,
    },
    quantityRow: {
      type: Number,
      required: true,
      default: 1,
    },
    capacity: {
      type: Number,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

RoomSchema.pre("save", function (next) {
  this.capacity = this.quantityColum * this.quantityRow;
  next();
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
