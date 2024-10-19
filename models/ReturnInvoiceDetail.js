const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ReturnInvoiceDetailSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    returnInvoiceCode: {
      type: String,
      required: true,
      ref: "ReturnInvoice",
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
  { timestamps: true, collection: "return_invoice_details" }
);

ReturnInvoiceDetailSchema.pre("save", async function (next) {
  try {
    const PriceDetail = mongoose.model("PriceDetail");

    const priceDetail = await PriceDetail.findOne({
      code: this.priceDetailCode,
    });
    if (!priceDetail) {
      return next(new Error("Price detail not found"));
    }
    this.totalAmount = priceDetail.price * this.quantity;
    next();
  } catch (error) {
    next(error);
  }
});

ReturnInvoiceDetailSchema.plugin(AutoIncrement, {
  inc_field: "returnInvoiceDetailId",
});
ReturnInvoiceDetailSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const ReturnInvoiceDetail = mongoose.model(
  "ReturnInvoiceDetail",
  ReturnInvoiceDetailSchema
);
module.exports = ReturnInvoiceDetail;
