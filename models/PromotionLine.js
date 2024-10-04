const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const PromotionLineSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    promotionCode: {
      type: String,
      ref: "Promotion",
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
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "promotion_lines" }
);
//Add plugin
PromotionLineSchema.plugin(AutoIncrement, { inc_field: "promotionLineId" });
PromotionLineSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const PromotionLine = mongoose.model("PromotionLine", PromotionLineSchema);
module.exports = PromotionLine;
