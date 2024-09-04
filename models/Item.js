const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema(
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
    type: {
      type: String,
      required: true,
      enum: ["Popcorn", "Drink", "Combo"],
    },
    size: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", ItemSchema);
module.exports = Item;
