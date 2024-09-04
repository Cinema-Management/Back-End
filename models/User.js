const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    type: {
      // 0: user, 1: staff
      type: int,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      // 0: inactive, 1: active
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
