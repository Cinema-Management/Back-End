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
    roomSizeCode: {
      // Thêm trường liên kết với bảng kích cỡ
      type: String,
      ref: "RoomSize",
      required: true,
      trim: true,
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
