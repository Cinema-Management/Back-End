const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ReturnInvoiceSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    customerCode: {
      type: String,
      ref: "User",
      default: null,
    },
    staffCode: {
      type: String,
      ref: "User",
      required: false,
      default: null,
    },
    scheduleCode: {
      type: String,
      ref: "Schedule",
      required: false,
      default: null,
    },
    paymentMethod: {
      type: Number,
      required: true,
    },
    type: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
    salesInvoiceCode: {
      type: String,
      ref: "SalesInvoice",
      required: true,
    },
    returnReason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, collection: "return_invoices" }
);

// Add plugins
ReturnInvoiceSchema.plugin(AutoIncrement, { inc_field: "returnInvoiceId" });
ReturnInvoiceSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const ReturnInvoice = mongoose.model("ReturnInvoice", ReturnInvoiceSchema);
module.exports = ReturnInvoice;
