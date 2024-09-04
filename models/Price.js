const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PricingSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
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

const Pricing = mongoose.model("Pricing", PricingSchema);
module.exports = Pricing;
