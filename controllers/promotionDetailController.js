const Product = require("../models/Product");
const PromotionDetail = require("../models/PromotionDetail ");
const promotionDetailController = {
  getAll: async (req, res) => {
    try {
      const promotionDetail = await PromotionDetail.find();
      res.status(200).send(promotionDetail);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  getAllByPromotionLineCode: async (req, res) => {
    try {
      const { code } = req.params;

      // Tìm các chi tiết khuyến mãi và populate dữ liệu từ bảng Product cho salesProductCode và freeProductCode
      const promotionDetails = await PromotionDetail.find({
        promotionLineCode: code,
      })
        .populate({
          path: "salesProductCode", // populate trường salesProductCode
          model: "Product", // Sử dụng model Product
          select: "code name",
          foreignField: "code", // Trường liên kết với bảng Product
          // Chỉ lấy các trường code và name từ bảng Product
        })
        .populate({
          path: "freeProductCode", // populate trường freeProductCode
          model: "Product", // Sử dụng model Product
          select: "code name",
          foreignField: "code", // Trường liên kết với bảng Product
        });

      res.status(200).send(promotionDetails);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const promotionDetail = await PromotionDetail.findOne({ code: code });

      if (!promotionDetail) {
        return res.status(404).json({ message: "promotionDetail not found" });
      }

      const deleteDetail = await PromotionDetail.delete({ code: code });

      return res.status(200).json({
        message: "promotionDetail deleted successfully",
        data: deleteDetail,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  add: async (req, res) => {
    try {
      const {
        promotionLineCode,
        salesProductCode,
        minQuantity,
        freeProductCode,
        freeQuantity,
        minPurchaseAmount,
        discountAmount,
        discountPercentage,
        maxDiscountAmount,
        type,
      } = req.body;

      // Tạo prefix dựa trên loại khuyến mãi
      let prefix;
      if (type === 0) {
        prefix = "CTKMH"; // Kiểu khuyến mãi tặng hàng
      } else if (type === 1) {
        prefix = "CTKMT"; // Kiểu khuyến mãi giảm giá cố định
      } else if (type === 2) {
        prefix = "CTCKHD"; // Kiểu khuyến mãi giảm giá theo phần trăm
      } else {
        return res.status(400).send({ message: "Invalid promotion type." });
      }

      // Lấy ngày hiện tại theo định dạng YYYY-MM-DD
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Lấy tất cả tài liệu bao gồm cả đã xóa
      const allPromotionDetails = await PromotionDetail.findWithDeleted();

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
      // Tạo đối tượng mới cho chi tiết khuyến mãi
      const newPromotionDetail = new PromotionDetail({
        code: newCode, // Sử dụng mã mới tự động tạo
        promotionLineCode,
        salesProductCode,
        minQuantity,
        freeProductCode,
        freeQuantity,
        minPurchaseAmount,
        discountAmount,
        discountPercentage,
        maxDiscountAmount,
        type,
      });

      // Kiểm tra loại khuyến mãi và xử lý theo loại
      if (type === 0) {
        // Kiểu khuyến mãi tặng hàng
        if (!minQuantity || !freeQuantity) {
          return res.status(400).send({
            message:
              "For type 0 promotions, minQuantity and freeQuantity are required.",
          });
        }
        const productSales = await Product.find(
          { code: salesProductCode },
          { type: 1 },
          { status: 1 }
        );
        if (!productSales) {
          return res.status(404).send({ message: "Product Sales not found" });
        }
        const productSalesFree = await Product.find(
          { code: freeProductCode },
          { type: 1 },
          { status: 1 }
        );
        if (!productSalesFree) {
          return res.status(404).send({ message: "Product  Free not found" });
        }
      } else if (type === 1) {
        // Kiểu khuyến mãi giảm giá cố định
        if (!minPurchaseAmount || !discountAmount) {
          return res.status(400).send({
            message:
              "For type 1 promotions, minPurchaseAmount and DiscountAmount are required.",
          });
        }
      } else if (type === 2) {
        // Kiểu khuyến mãi giảm giá theo phần trăm
        if (
          !minPurchaseAmount ||
          discountPercentage === undefined ||
          !maxDiscountAmount
        ) {
          return res.status(400).send({
            message:
              "For type 2 promotions, minPurchaseAmount, discountPercentage, and maxDiscountAmount are required.",
          });
        }
        if (discountPercentage < 0 || discountPercentage > 100) {
          return res.status(400).send({
            message: "discountPercentage must be between 5 and 100.",
          });
        }
      }

      // Lưu chi tiết khuyến mãi
      await newPromotionDetail.save();
      return res.status(201).send(newPromotionDetail);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { code } = req.params; // Mã khuyến mãi từ params
      const {
        salesProductCode,
        minQuantity,
        freeProductCode,
        freeQuantity,
        minPurchaseAmount,
        discountAmount,
        discountPercentage,
        maxDiscountAmount,
        type,
      } = req.body;

      // Tìm chi tiết khuyến mãi dựa trên mã
      const promotionDetail = await PromotionDetail.findOne({ code });

      // Kiểm tra xem chi tiết khuyến mãi có tồn tại không
      if (!promotionDetail) {
        return res.status(404).send({
          message: "Promotion detail not found",
        });
      }

      // Kiểm tra loại khuyến mãi và cập nhật giá trị phù hợp
      if (type === 0) {
        // Kiểu khuyến mãi tặng hàng
        if (!minQuantity || !freeQuantity) {
          return res.status(400).send({
            message:
              "For type 0 promotions, minQuantity and freeQuantity are required.",
          });
        }
        const productSales = await Product.find(
          { code: salesProductCode },
          { type: 1, status: 1 }
        );
        if (!productSales) {
          return res.status(404).send({ message: "Product Sales not found" });
        }
        const productSalesFree = await Product.find(
          { code: freeProductCode },
          { type: 1, status: 1 }
        );
        if (!productSalesFree) {
          return res.status(404).send({ message: "Product Free not found" });
        }
        // Cập nhật giá trị khuyến mãi tặng hàng
        promotionDetail.salesProductCode = salesProductCode;
        promotionDetail.minQuantity = minQuantity;
        promotionDetail.freeProductCode = freeProductCode;
        promotionDetail.freeQuantity = freeQuantity;
      } else if (type === 1) {
        // Kiểu khuyến mãi giảm giá cố định
        if (!minPurchaseAmount || !discountAmount) {
          return res.status(400).send({
            message:
              "For type 1 promotions, minPurchaseAmount and DiscountAmount are required.",
          });
        }
        // Cập nhật giá trị khuyến mãi giảm giá cố định
        promotionDetail.minPurchaseAmount = minPurchaseAmount;
        promotionDetail.discountAmount = discountAmount;
      } else if (type === 2) {
        // Kiểu khuyến mãi giảm giá theo phần trăm
        if (
          !minPurchaseAmount ||
          discountPercentage === undefined ||
          !maxDiscountAmount
        ) {
          return res.status(400).send({
            message:
              "For type 2 promotions, minPurchaseAmount, discountPercentage, and maxDiscountAmount are required.",
          });
        }
        if (discountPercentage < 0 || discountPercentage > 100) {
          return res.status(400).send({
            message: "DiscountPercentage must be between 5 and 100.",
          });
        }
        // Cập nhật giá trị khuyến mãi giảm giá theo phần trăm
        promotionDetail.minPurchaseAmount = minPurchaseAmount;
        promotionDetail.discountPercentage = discountPercentage;
        promotionDetail.maxDiscountAmount = maxDiscountAmount;
      } else {
        return res.status(400).send({
          message: "Invalid promotion type.",
        });
      }

      // Cập nhật các trường khác nếu có thay đổi

      promotionDetail.code = code;

      promotionDetail.salesProductCode =
        salesProductCode || promotionDetail.salesProductCode;
      promotionDetail.minQuantity = minQuantity || promotionDetail.minQuantity;
      promotionDetail.freeProductCode =
        freeProductCode || promotionDetail.freeProductCode;
      promotionDetail.freeQuantity =
        freeQuantity || promotionDetail.freeQuantity;
      promotionDetail.minPurchaseAmount =
        minPurchaseAmount || promotionDetail.minPurchaseAmount;
      promotionDetail.discountAmount =
        discountAmount || promotionDetail.discountAmount;
      promotionDetail.discountPercentage =
        discountPercentage || promotionDetail.discountPercentage;
      promotionDetail.maxDiscountAmount =
        maxDiscountAmount || promotionDetail.maxDiscountAmount;
      promotionDetail.type = type;

      // Lưu các thay đổi vào cơ sở dữ liệu
      await promotionDetail.save();

      return res.status(200).send(promotionDetail);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
};
module.exports = promotionDetailController;
