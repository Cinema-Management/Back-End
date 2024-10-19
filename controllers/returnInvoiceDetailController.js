const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnInvoiceDetail = require("../models/ReturnInvoiceDetail");
const PriceDetail = require("../models/PriceDetail");

const returnInvoiceDetailController = {
  getAll: async (req, res) => {
    try {
      const returnInvoiceDetails = await ReturnInvoiceDetail.find();
      return res.status(200).json(returnInvoiceDetails);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  add: async (req, res) => {
    try {
      const { returnInvoiceCode, productCode, priceDetailCode, quantity } =
        req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Đếm số hóa đơn trả hàng trong ngày
      const invoiceCount = await ReturnInvoiceDetail.countDocuments({
        code: { $regex: `^CTHDT${formattedDate}-` },
      });

      const newInvoiceNumber = invoiceCount + 1;
      const code = `CTHDT${formattedDate}-${newInvoiceNumber}`;

      const returnInvoice = await ReturnInvoice.findOne({
        code: returnInvoiceCode,
      });
      if (!returnInvoice) {
        return res.status(404).send({ message: "Return invoice not found" });
      }

      // Kiểm tra tồn tại của chi tiết giá
      const priceDetail = await PriceDetail.findOne({ code: priceDetailCode });
      if (!priceDetail) {
        return res.status(404).send({ message: "Price detail not found" });
      }

      // Tạo chi tiết hóa đơn trả hàng
      const returnInvoiceDetail = new ReturnInvoiceDetail({
        code,
        returnInvoiceCode,
        productCode,
        priceDetailCode,
        quantity,
      });

      // Lưu chi tiết hóa đơn trả hàng
      await returnInvoiceDetail.save();
      return res.status(201).send(returnInvoiceDetail);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
};

module.exports = returnInvoiceDetailController;
