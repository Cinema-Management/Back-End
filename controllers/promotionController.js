const Promotion = require("../models/Promotion");
const PromotionLine = require("../models/PromotionLine");
const promotionCOntroller = {
  add: async (req, res) => {
    try {
      const { description, startDate, endDate } = req.body;

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
      const overlappingPromotion = await Promotion.findOne({
        $or: [
          {
            // Điều kiện 1: Khuyến mãi mới bắt đầu trước khi một khuyến mãi đã tồn tại kết thúc và kết thúc sau khi khuyến mãi đã tồn tại bắt đầu
            startDate: { $lte: endDateNew },
            endDate: { $gte: startDateNew },
          },
        ],
      });

      if (overlappingPromotion) {
        return res.status(400).send({
          message: `There is already a promotion in the same date range from ${overlappingPromotion.startDate
            .toISOString()
            .substring(0, 10)} to ${overlappingPromotion.endDate
            .toISOString()
            .substring(0, 10)}`,
        });
      }

      // Tạo mã khuyến mãi mới
      const lastPromotion = await Promotion.findOne().sort({ promotionId: -1 });

      // Định dạng mã theo kiểu "KMYYYY-MM-DD"
      const today = new Date(startDate);
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Tháng 2 chữ số
      const day = today.getDate().toString().padStart(2, '0'); // Ngày 2 chữ số
      const newCode = `KM${year}-${month}-${day}`;

      const promotion = new Promotion({
        code: newCode,
        description,
        startDate,
        endDate,
      });

      await promotion.save();
      return res.status(201).send(promotion);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const promotions = await Promotion.find();
      return res.status(200).send(promotions);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  getPromotionsWithLines: async (req, res) => {
    try {
      // Lấy tất cả các khuyến mãi
      const promotions = await Promotion.find();

      // Sử dụng `Promise.all` để lấy các dòng khuyến mãi cho từng khuyến mãi
      const promotionsWithLines = await Promise.all(
        promotions.map(async (promotion) => {
          const promotionLines = await PromotionLine.find({
            promotionCode: promotion.code, // Sử dụng promotionCode để tìm dòng khuyến mãi
          });
          return {
            ...promotion._doc, // Lấy dữ liệu của Promotion
            promotionLines: promotionLines, // Thêm các dòng khuyến mãi tương ứng
          };
        })
      );

      // Trả về kết quả
      return res.status(200).json(promotionsWithLines);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { code } = req.params;
      const { description, startDate, endDate } = req.body;

      // Tìm khuyến mãi dựa vào mã
      const promotion = await Promotion.findOne({ code });

      // Kiểm tra xem khuyến mãi có tồn tại không
      if (!promotion) {
        return res.status(404).send({
          message: "Promotion not found",
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
      const overlappingPromotion = await Promotion.findOne({
        $or: [
          {
            _id: { $ne: promotion._id }, // Loại trừ chương trình hiện tại
            startDate: { $lt: endDateNew },
            endDate: { $gt: startDateNew },
          },
        ],
      });

      if (overlappingPromotion) {
        return res.status(400).send({
          message: `There is already a promotion in the same date range from ${overlappingPromotion.startDate
            .toISOString()
            .substring(0, 10)} to ${overlappingPromotion.endDate
            .toISOString()
            .substring(0, 10)}`,
        });
      }

      // Cập nhật thông tin khuyến mãi
      promotion.description = description;
      promotion.startDate = startDateNew;
      promotion.endDate = endDateNew;

      await promotion.save(); // Lưu khuyến mãi đã cập nhật

      return res.status(200).send(promotion); // Trả về khuyến mãi đã được cập nhật
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const promotion = await Promotion.findOne({ code: code });

      if (!promotion) {
        return res.status(404).json({ message: "promotion not found" });
      }

      const deleteDetail = await Promotion.delete({ code: code });

      return res.status(200).json({
        message: "promotion deleted successfully",
        data: deleteDetail,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
module.exports = promotionCOntroller;
