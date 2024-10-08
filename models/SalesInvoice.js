const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const salesInvoiceSchema = new Schema(
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
  },
  { timestamps: true, collection: "sales_invoices" }
);
// Add plugins
salesInvoiceSchema.plugin(AutoIncrement, { inc_field: "salesInvoiceId" });
salesInvoiceSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const SalesInvoice = mongoose.model("SalesInvoice", salesInvoiceSchema);
module.exports = SalesInvoice;
