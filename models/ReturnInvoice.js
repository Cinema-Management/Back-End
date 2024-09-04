const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReturnInvoiceSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    salesInvoiceCode: {
      type: String,
      required: true,
      ref: "SalesInvoice",
    },
    returnDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const ReturnInvoice = mongoose.model("ReturnInvoice", ReturnInvoiceSchema);
module.exports = ReturnInvoice;
