const PromotionLine = require("../models/PromotionLine");
const Promotion = require("../models/Promotion");
const promotionLineController = {
  add: async (req, res) => {
    try {
      const { promotionCode, description, startDate, endDate } = req.body;

      // Kiểm tra sự tồn tại của chương trình khuyến mãi
      const promotion = await Promotion.findOne({ code: promotionCode });
      if (!promotion) {
        return res.status(404).send({ message: "Promotion not found" });
      }

      const currentDate = new Date();
      const startDateNew = new Date(startDate);
      const endDateNew = new Date(endDate);

      // Kiểm tra ngày bắt đầu có lớn hơn ngày hiện tại hay không
      if (startDateNew <= currentDate) {
        return res.status(400).send({
          message: "Start date must be greater than the current date",
        });
      }

      // Kiểm tra ngày kết thúc có lớn hơn hoặc bằng ngày bắt đầu không
      if (endDateNew < startDateNew) {
        return res.status(400).send({
          message:
            "The end date must be greater than or equal to the start date",
        });
      }

      // Kiểm tra xem khoảng thời gian của dòng khuyến mãi có nằm trong hoặc bằng thời gian của chương trình khuyến mãi hay không
      if (
        startDateNew < new Date(promotion.startDate) ||
        endDateNew > new Date(promotion.endDate)
      ) {
        return res.status(400).send({
          message: `The promotion line's start and end dates must be within or equal to the promotion's date range from ${promotion.startDate
            .toISOString()
            .substring(0, 10)} to ${promotion.endDate
            .toISOString()
            .substring(0, 10)}`,
        });
      }

      // Kiểm tra chồng chéo ngày với các dòng khuyến mãi khác
      const overlappingPromotionLine = await PromotionLine.findOne({
        promotionCode,
        $or: [
          { startDate: { $lt: endDateNew }, endDate: { $gt: startDateNew } }, // Dòng khuyến mãi đã tồn tại có khoảng ngày nằm trong khoảng ngày của dòng mới
        ],
      });

      if (overlappingPromotionLine) {
        return res.status(400).send({
          message: `There is already a promotion line in the same date range from ${overlappingPromotionLine.startDate
            .toISOString()
            .substring(0, 10)} to ${overlappingPromotionLine.endDate
            .toISOString()
            .substring(0, 10)}`,
        });
      }

      // Tạo mã cho dòng khuyến mãi mới
      const lastPromotion = await PromotionLine.findOne().sort({
        promotionLineId: -1,
      });

      let newCode = "DKM01";
      if (lastPromotion) {
        const lastCodeNumber = parseInt(lastPromotion.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `DKM0${nextCodeNumber}`
            : `DKM${nextCodeNumber}`;
      }

      // Tạo mới dòng khuyến mãi
      const promotionLines = new PromotionLine({
        code: newCode,
        promotionCode,
        description,
        startDate: startDateNew,
        endDate: endDateNew,
      });

      await promotionLines.save();
      return res.status(201).send(promotionLines);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const promotionLines = await PromotionLine.find();
      return res.json(promotionLines);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};
module.exports = promotionLineController;