const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PromotionResultSchema = new Schema(
  {
    promotionCode: {
      type: String,
      required: true,
      ref: "Promotion",
    },
    SalesInvoiceCode: {
      type: String,
      required: true,
      ref: "SalesInvoice",
    },
    totalDiscount: {
      type: Number,
      required: true, // Tổng số tiền giảm giá áp dụng
    },
    appliedDate: {
      type: Date,
      required: true, // Ngày áp dụng khuyến mãi
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const PromotionResult = mongoose.model(
  "PromotionResult",
  PromotionResultSchema
);
module.exports = PromotionResult;
