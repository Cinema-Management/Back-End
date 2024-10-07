const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const PriceSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    dayOfWeek: [
      {
        type: Number,
        required: false,
      },
    ],
    timeSlot: {
      type: Number,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      default: 0, //status: 0: active, 1: inactive
    },
  },
  { timestamps: true }
);

// Add plugins

PriceSchema.plugin(AutoIncrement, { inc_field: "priceId" });

PriceSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Price = mongoose.model("Price", PriceSchema);
module.exports = Price;
