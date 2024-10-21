const PromotionDetail = require("../models/PromotionDetail ");
const PromotionResult = require("../models/PromotionResult");
const SalesInvoice = require("../models/SalesInvoice");
const promotionResultController = {
  add: async (req, res) => {
    try {
      const {
        salesInvoiceCode,
        promotionDetailCode,
        freeProductCode,
        freeQuantity,
        discountAmount,
      } = req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Tìm tất cả khuyến mãi đã tồn tại cho ngày hôm nay
      const invoiceCount = await PromotionResult.countDocuments({
        code: { $regex: `^KQKM${formattedDate}-` }, // Sửa regex để khớp định dạng HDBYYYY-MM-DD-
      });

      // Tạo mã code mới
      const newInvoiceNumber = invoiceCount + 1; // Tăng số đếm

      const code = `KQKM${formattedDate}-${newInvoiceNumber}`; // Định dạng mã

      const salesInvoice = await SalesInvoice.findOne({
        code: salesInvoiceCode,
      });
      if (!salesInvoice) {
        return res.status(404).send({ message: "Sales Invoice not found" });
      }
      const promotionDetail = await PromotionDetail.findOne({
        code: promotionDetailCode,
      });
      if (!promotionDetail) {
        return res.status(404).send({ message: "Promotion Detail not found" });
      }

      const promotionResult = new PromotionResult({
        code,
        salesInvoiceCode,
        promotionDetailCode,
        freeProductCode,
        freeQuantity,
        discountAmount,
      });

      await promotionResult.save();
      res.status(201).send(promotionResult);
    } catch (error) {
      res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const promotionResults = await PromotionResult.find();
      res.status(200).send(promotionResults);
    } catch (error) {
      res.status(400).send(error);
    }
  },
  getBySalesInvoiceCode: async (req, res) => {
    try {
      const { salesInvoiceCode } = req.params;
      const promotionResults = await PromotionResult.findOne({
        salesInvoiceCode: salesInvoiceCode,
      });
      if (!promotionResults) {
        return res.status(200).send("");
      }
      const promotionPop = await promotionResults.populate({
        path: "freeProductCode",
        model: "Product",
        select: "name description",
        foreignField: "code",
      });

      res.status(200).send(promotionPop);
    } catch (error) {
      res.status(400).send(error);
    }
  },
};
module.exports = promotionResultController;
