const PriceDetail = require("../models/PriceDetail");
const SalesInvoice = require("../models/SalesInvoice");
const SalesInvoiceDetail = require("../models/SalesInvoiceDetail");
const salesInvoiceDetailController = {
  getAll: async (req, res) => {
    try {
      const salesInvoiceDetails = await SalesInvoiceDetail.find();
      return res.status(200).json(salesInvoiceDetails);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  add: async (req, res) => {
    try {
      const { salesInvoiceCode, productCode, priceDetailCode, quantity } =
        req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      const invoiceCount = await SalesInvoiceDetail.countDocuments({
        code: { $regex: `^CTHDB${formattedDate}-` },
      });

      // Tạo mã code mới
      const newInvoiceNumber = invoiceCount + 1; // Tăng số đếm

      const code = `CTHDB${formattedDate}-${newInvoiceNumber}`; // Định dạng mã

      const salesInvoice = await SalesInvoice.findOne({
        code: salesInvoiceCode,
      });
      if (!salesInvoice) {
        return res.status(404).send({ message: "Sales invoice not found" });
      }
      const priceDetail = await PriceDetail.findOne({ code: priceDetailCode });
      if (!priceDetail) {
        return res.status(404).send({ message: "Price detail not found" });
      }

      const salesInvoiceDetail = new SalesInvoiceDetail({
        code,
        salesInvoiceCode,
        productCode,
        priceDetailCode,
        quantity,
      });
      await salesInvoiceDetail.save();
      return res.status(201).send(salesInvoiceDetail);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
};
module.exports = salesInvoiceDetailController;
