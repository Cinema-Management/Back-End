const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PromotionSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    promotionType: {
      type: String,
      ref: "PromotionType",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Promotion = mongoose.model("Promotion", PromotionSchema);
module.exports = Promotion;
