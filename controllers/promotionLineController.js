const PromotionLine = require("../models/PromotionLine");
const Promotion = require("../models/Promotion");
const PromotionDetail = require("../models/PromotionDetail ");
const promotionLineController = {
  add: async (req, res) => {
    try {
      const { promotionCode, description, startDate, endDate, type } = req.body;

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
        type,
        $or: [
          {
            // Điều kiện 1: Ngày bắt đầu của dòng khuyến mãi mới nằm trong khoảng thời gian của dòng khuyến mãi đã tồn tại
            startDate: { $lt: endDateNew },
            endDate: { $gt: startDateNew },
          },
          {
            // Điều kiện 2: Ngày bắt đầu của dòng khuyến mãi hiện có nằm trong khoảng thời gian của dòng khuyến mãi mới
            startDate: { $gt: startDateNew },
            endDate: { $lt: endDateNew },
          },
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
      // Tạo prefix dựa trên loại khuyến mãi
      let prefix;
      if (type === 0) {
        prefix = "KMH"; // Kiểu khuyến mãi tặng hàng
      } else if (type === 1) {
        prefix = "KMT"; // Kiểu khuyến mãi giảm giá cố định
      } else if (type === 2) {
        prefix = "CKHD"; // Kiểu khuyến mãi giảm giá theo phần trăm
      } else {
        return res.status(400).send({ message: "Invalid promotion type." });
      }

      let targetDate = new Date(startDateNew);

      // Lùi 7 giờ để chuyển từ giờ Việt Nam về UTC (tránh dùng Date.UTC vì dữ liệu đã lưu dưới dạng UTC)
      const vietnamTimezoneOffset = 7 * 60; // Phút (-7 giờ)
      targetDate = new Date(
        targetDate.getTime() + vietnamTimezoneOffset * 60 * 1000
      ); // Lùi 7 giờ về UTC

      // Tạo startOfDay và endOfDay dựa trên giờ UTC (đã lùi 7 giờ từ giờ Việt Nam)
      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        0,
        0,
        0
      ); // 00:00:00 giờ UTC

      const formattedDate = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

      // Lấy tất cả tài liệu bao gồm cả đã xóa
      const allPromotionDetails = await PromotionLine.findWithDeleted();

      // Tìm mã mới
      let newCode = `${prefix}${formattedDate}-1`; // Bắt đầu với 1
      let existingCodes = new Set();

      // Thu thập các mã đã tồn tại
      allPromotionDetails.forEach((detail) => {
        if (detail.code.startsWith(`${prefix}${formattedDate}-`)) {
          existingCodes.add(detail.code);
        }
      });

      // Tăng số thứ tự nếu mã đã tồn tại
      let lastCodeNumber = 1;
      while (existingCodes.has(newCode)) {
        lastCodeNumber++;
        newCode = `${prefix}${formattedDate}-${lastCodeNumber}`;
      }
      // Tạo mới dòng khuyến mãi
      const promotionLines = new PromotionLine({
        code: newCode,
        promotionCode,
        description,
        startDate: startDateNew,
        endDate: endDateNew,
        type,
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

  update: async (req, res) => {
    try {
      const { code } = req.params;
      const { description, startDate, endDate } = req.body;

      // Tìm khuyến mãi dựa vào mã
      const promotionLine = await PromotionLine.findOne({ code });

      // Kiểm tra xem khuyến mãi có tồn tại không
      if (!promotionLine) {
        return res.status(404).send({
          message: "promotionLine not found",
        });
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

      // Kiểm tra chồng chéo ngày với các chương trình khuyến mãi khác
      const overlappingPromotionLine = await promotionLine.findOne({
        $or: [
          {
            _id: { $ne: promotionLine._id }, // Loại trừ chương trình hiện tại
            startDate: { $lt: endDateNew },
            endDate: { $gt: startDateNew },
          },
        ],
      });

      if (overlappingPromotionLine) {
        return res.status(400).send({
          message: `There is already a promotionLine in the same date range from ${overlappingPromotionLine.startDate
            .toISOString()
            .substring(0, 10)} to ${overlappingPromotionLine.endDate
            .toISOString()
            .substring(0, 10)}`,
        });
      }

      // Cập nhật thông tin khuyến mãi
      promotionLine.description = description;
      promotionLine.startDate = startDateNew;
      promotionLine.endDate = endDateNew;

      await promotionLine.save(); // Lưu khuyến mãi đã cập nhật

      return res.status(200).send(promotionLine); // Trả về khuyến mãi đã được cập nhật
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  updateStatus: async (req, res) => {
    try {
      const { code, status } = req.body;

      const promotionLine = await PromotionLine.findOne({ code: code });
      if (!promotionLine) {
        return res.status(404).send({ message: "PromotionLine not found" });
      }

      promotionLine.status = status;
      await promotionLine.save();
      return res.status(201).json(promotionLine);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const promotionLine = await PromotionLine.findOne({ code: code });

      if (!promotionLine) {
        return res.status(404).json({ message: "promotionLine not found" });
      }

      const deleteDetail = await PromotionLine.delete({ code: code });

      return res.status(200).json({
        message: "promotionLine deleted successfully",
        data: deleteDetail,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
module.exports = promotionLineController;
