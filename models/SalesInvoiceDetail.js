const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema cho chi tiết hóa đơn bán (InvoiceDetail)
const SalesInvoiceDetailSchema = new Schema(
  {
    salesInvoiceCode: {
      type: String,
      required: true,
      ref: "SalesInvoiceCode",
    },
    ticketCode: {
      type: String,
      ref: "Ticket",
    },
    itemCode: {
      type: String,
      ref: "Item",
      required: true,
    },

    quantityItem: {
      type: Number,
      required: true,
    },
    totlaPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const SalesInvoiceDetail = mongoose.model(
  "SalesInvoiceDetail",
  SalesInvoiceDetailSchema
);
module.exports = SalesInvoiceDetail;
