const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const productTypeSchema = new Schema(
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
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true, collection: "product_types" }
);

productTypeSchema.plugin(AutoIncrement, { inc_field: "productTypeId" });

productTypeSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const SeatType = mongoose.model("ProductType", productTypeSchema);
module.exports = SeatType;
