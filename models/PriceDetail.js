const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const PriceDetailSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    priceCode: {
      type: String,
      ref: "Price",
      trim: true,
    },
    productCode: {
      type: String,
      ref: "Product",
      trim: true,
    }, // type:1
    productTypeCode: {
      type: String,
      ref: "ProductType",
    }, // type:0
    roomTypeCode: {
      type: String,
      ref: "RoomType",
    }, // type:0

    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    }, // 0: Seat, 1: Food and Combo
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "price_details" }
);
// Add plugins
PriceDetailSchema.plugin(AutoIncrement, { inc_field: "priceDetailId" });

PriceDetailSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const PriceDetail = mongoose.model("PriceDetail", PriceDetailSchema);
module.exports = PriceDetail;
