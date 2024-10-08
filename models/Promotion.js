const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const PromotionSchema = new Schema(
  {
    code: {
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
      default: 0,
    },
  },
  { timestamps: true }
);
//Add plugin
PromotionSchema.plugin(AutoIncrement, { inc_field: "promotionId" });
PromotionSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Promotion = mongoose.model("Promotion", PromotionSchema);
module.exports = Promotion;
