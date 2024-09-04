const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho chi tiết khuyến mãi (PromotionDetail)
const PromotionDetailSchema = new Schema(
  {
    promotionCode: {
      type: String,
      required: true,
      ref: "Promotion",
    },
    itemCode: {
      type: String,
      required: false,
    },

    minQuantity: {
      type: Number,
      required: false, // Số lượng mặt hàng cần mua tối thiểu (dành cho các khuyến mãi kiểu "mua X tặng Y")
    },
    freeQuantity: {
      type: Number,
      required: false, // Số lượng tặng (dành cho các khuyến mãi kiểu "mua X tặng Y")
    },
    minPurchaseAmount: {
      type: Number,
      required: false, // Giá trị mua tối thiểu để áp dụng khuyến mãi (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },
    discountPercentage: {
      type: Number,
      required: false, // Giảm giá phần trăm (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },
    maxDiscountAmount: {
      type: Number,
      required: false, // Giảm giá tối đa (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },

    type: {
      type: String,
      enum: ["discount", "free"],
      required: true, // Loại khuyến mãi: "discount" (giảm giá), "free" (tặng hàng)
    },
  },
  { timestamps: true }
);

const PromotionDetail = mongoose.model(
  "PromotionDetail",
  PromotionDetailSchema
);
module.exports = PromotionDetail;
