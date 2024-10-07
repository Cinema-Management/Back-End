const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
// Schema cho chi tiết hóa đơn bán (InvoiceDetail)
const SalesInvoiceDetailSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    salesInvoiceCode: {
      type: String,
      required: true,
      ref: "SalesInvoice",
      trim: true,
    },
    productCode: {
      type: String,
      ref: "Product",
      required: true,
      trim: true,
    },
    priceDetailCode: {
      type: String,
      ref: "PriceDetail",
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
    },
  },
  { timestamps: true, collection: "sales_invoice_details" }
);

//

SalesInvoiceDetailSchema.pre("save", async function (next) {
  try {
    const PriceDetail = mongoose.model("PriceDetail"); // Model PriceDetail

    // Tìm giá từ PriceDetail dựa trên priceDetail code
    const priceDetail = await PriceDetail.findOne({
      code: this.priceDetailCode,
    });
    if (!priceDetail) {
      return next(new Error("Price detail not found"));
    }

    // Tính totalAmount = price * quantity
    this.totalAmount = priceDetail.price * this.quantity;
    next();
  } catch (error) {
    next(error);
  }
});
// Add plugins
SalesInvoiceDetailSchema.plugin(AutoIncrement, {
  inc_field: "salesInvoiceDetailId",
});
SalesInvoiceDetailSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});
const SalesInvoiceDetail = mongoose.model(
  "SalesInvoiceDetail",
  SalesInvoiceDetailSchema
);
module.exports = SalesInvoiceDetail;
