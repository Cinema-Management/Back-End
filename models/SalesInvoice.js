const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const salesInvoiceSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    userCode: {
      type: String,
      ref: "User",
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    status: {
      type: Number,
      // 1: Paid ,0: Cancelled
      default: 1,
    },
  },
  { timestamps: true }
);

const SalesInvoice = mongoose.model("SalesInvoice", salesInvoiceSchema);
module.exports = SalesInvoice;
