const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
// Schema cho chi tiết khuyến mãi (PromotionDetail)
const PromotionDetailSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    //type ===1

    promotionLineCode: {
      type: String,
      required: true,
      ref: "PromotionLine",
    },
    salesProductCode: {
      type: String,
      ref: "Product",
      required: false,
    },

    minQuantity: {
      type: Number,
      required: false, // Số lượng mặt hàng cần mua tối thiểu (dành cho các khuyến mãi kiểu "mua X tặng Y")
    },
    freeProductCode: {
      type: String,
      ref: "Product",
      required: false,
    },

    freeQuantity: {
      type: Number,
      required: false, // Số lượng tặng (dành cho các khuyến mãi kiểu "mua X tặng Y")
    },

    minPurchaseAmount: {
      type: Number,
      required: false, // Giá trị mua tối thiểu để áp dụng khuyến mãi (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },
    discountAmount: {
      type: Number,
      required: false, // Giảm giá cố định (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },
    discountPercentage: {
      type: Number,
      required: false,
    },
    maxDiscountAmount: {
      type: Number,
      required: false, // Giảm giá tối đa (dành cho các khuyến mãi kiểu "mua Y giảm X%")
    },

    type: {
      type: Number,
      enum: [0, 1, 2],
      required: true, // Loại khuyến mãi: "discount" (giảm giá), "free" (tặng hàng)
    },
  },
  { timestamps: true, collection: "promotion_details" }
);

PromotionDetailSchema.virtual("relevantFields").get(function () {
  const fields = [];
  switch (this.type) {
    case 0:
      fields.push(
        "productSalesCode",
        "minQuantity",
        "productSalesFree",
        "freeQuantity"
      );
      break;
    case 1:
      fields.push("minPurchaseAmount", "discountAmount");
      break;
    case 2:
      fields.push(
        "minPurchaseAmount",
        "discountPercentage",
        "maxDiscountAmount"
      );
      break;
    default:
      break;
  }
  return fields;
});
// Add plugins
PromotionDetailSchema.plugin(AutoIncrement, {
  inc_field: "promotionDetailId",
});
PromotionDetailSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const PromotionDetail = mongoose.model(
  "PromotionDetail",
  PromotionDetailSchema
);
module.exports = PromotionDetail;
