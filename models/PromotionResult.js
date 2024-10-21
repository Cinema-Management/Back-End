const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const PromotionResultSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    promotionDetailCode: {
      type: String,
      required: true,
      ref: "PromotionDetail",
    },
    salesInvoiceCode: {
      type: String,
      required: true,
      ref: "SalesInvoice",
    },
    freeProductCode: {
      type: String,
      ref: "Product",
      default: null,
    },
    freeQuantity: {
      type: Number,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: 1, // 0: refund , 1: applied
    },
  },
  { timestamps: true, collection: "promotion_results" }
);
// Add plugin
PromotionResultSchema.plugin(AutoIncrement, { inc_field: "promotionResultId" });
PromotionResultSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const PromotionResult = mongoose.model(
  "PromotionResult",
  PromotionResultSchema
);
module.exports = PromotionResult;
