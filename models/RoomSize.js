const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const RoomSizeSchema = new Schema(
  {
    code: { type: String, required: true, trim: true }, // Mã kích cỡ (VD: SIZE01)
    name: { type: String, required: true, trim: true }, // Tên kích cỡ (Nhỏ, Vừa, Lớn)
    description: { type: String, required: false, trim: true }, // Mô tả (nếu cần)
    status: { type: Number, default: 1 }, // Trạng thái (1: hoạt động, 0: không hoạt động)
  },
  { timestamps: true, collection: "room_sizes" }
);

// Thêm AutoIncrement cho mã kích cỡ nếu cần
RoomSizeSchema.plugin(AutoIncrement, { inc_field: "roomSizeId" });

RoomSizeSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const RoomSize = mongoose.model("RoomSize", RoomSizeSchema);
module.exports = RoomSize;
