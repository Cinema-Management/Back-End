const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PromotionTypeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PromotionType = mongoose.model("PromotionType", PromotionTypeSchema);
module.exports = PromotionType;
