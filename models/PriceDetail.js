const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PricingDetailSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    priceCode: {
      type: String,
      ref: "Price",
    },
    itemCode: {
      type: String,
      ref: "Item",
    },
    seatTypeCode: {
      type: String,
      ref: "SeatType",
    },
    price: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const PricingDetail = mongoose.model("PricingDetail", PricingDetailSchema);
module.exports = PricingDetail;
