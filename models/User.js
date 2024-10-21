const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const UserSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      ref: "HierarchyValue",
      required: false,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: null, // Mặc định là 0 điểm
    },
    customerType: {
      type: String,
      ref: "HierarchyValue",
      required: false,
      trim: true,
    },
    type: {
      // 0: user, 1: staff
      type: Number,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    cinemaCode: {
      type: String,
      ref: "Cinema",
      trim: true,

      default: null,
    },
    status: {
      // 0: inactive, 1: active
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
UserSchema.pre("save", function (next) {
  // Kiểm tra nếu type là 0
  if (this.type === 1) {
    this.points = undefined; // Không lưu điểm
    this.customerType = undefined; // Không lưu loại khách hàng
  }
  next();
});

//add plugins
UserSchema.plugin(AutoIncrement, { inc_field: "userId" });
UserSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
