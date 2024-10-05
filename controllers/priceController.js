const Price = require("../models/Price");
const PriceDetail = require("../models/PriceDetail");
const ProductType = require("../models/ProductType");
const RoomType = require("../models/RoomType");
const Product = require("../models/Product");

const priceController = {
  add: async (req, res) => {
    try {
      const {
        description,
        startDate,
        endDate,
        dayOfWeek,
        timeSlot,
        status,
        type,
      } = req.body;

      const existingPrice = await Price.findOne({
        description,
        type,
        timeSlot,
        dayOfWeek,
      });
      const currentDate = new Date();
      const startDateNew = startDate;
      const endDateNew = endDate;

      if (existingPrice) {
        const startDateExisting = new Date(startDate);
        const endDateExisting = new Date(existingPrice.endDate);
        if (startDateExisting <= endDateExisting) {
          return res.status(400).send({
            message: "Price description already exists for the same type",
          });
        }
      }

      if (new Date(startDateNew) <= currentDate) {
        return res.status(400).send({
          message: "Start date must be greater than the current date",
        });
      }
      if (endDateNew < startDateNew) {
        return res.status(400).send({
          message:
            "The end date must be greater than or equal to the start date",
        });
      }

      const lastPrice = await Price.findOne().sort({
        priceId: -1,
      });

      let newCode = "BG01";
      if (lastPrice) {
        const lastCodeNumber = parseInt(lastPrice.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `BG0${nextCodeNumber}` : `BG${nextCodeNumber}`;
      }

      const price = new Price({
        code: newCode,
        description,
        startDate: startDateNew,
        endDate: endDateNew,
        type,
        dayOfWeek,
        timeSlot,
        status,
      });

      await price.save();
      return res.status(201).send(price);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  addPriceFood: async (req, res) => {
    try {
      const { description, startDate, endDate, status, type } = req.body;

      const existingPrice = await Price.findOne({ description, type });
      if (existingPrice) {
        return res.status(400).send({
          message: "Price description already exists for the same type",
        });
      }

      const currentDate = new Date();
      const startDateNew = startDate;
      const endDateNew = endDate;

      if (new Date(startDateNew) <= currentDate) {
        return res.status(400).send({
          message: "Start date must be greater than the current date",
        });
      }
      if (endDateNew < startDateNew) {
        return res.status(400).send({
          message:
            "The end date must be greater than or equal to the start date",
        });
      }

      const lastPrice = await Price.findOne().sort({
        priceId: -1,
      });

      let newCode = "BG01";
      if (lastPrice) {
        const lastCodeNumber = parseInt(lastPrice.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `BG0${nextCodeNumber}` : `BG${nextCodeNumber}`;
      }

      const price = new Price({
        code: newCode,
        description,
        startDate: startDateNew,
        endDate: endDateNew,
        type,
        status,
      });

      await price.save();
      return res.status(201).send(price);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const {
        description,
        startDate,
        endDate,
        status,
        type,
        dayOfWeek,
        timeSlot,
      } = req.body;
      const priceCode = req.params.code;
      console.log(priceCode);
      const price = await Price.findOne({ code: priceCode });
      if (!price) {
        return res.status(404).send({ message: "Price not found" });
      }

      console.log(startDate);
      console.log(endDate);

      if (price.status === 1) {
        const currentDate = new Date();
        const startDateNew = new Date(startDate);
        const endDateNew = new Date(endDate);
        if (endDateNew < startDateNew) {
          return res.status(400).send({
            message:
              "The end date must be greater than or equal to the start date",
          });
        }
        price.endDate = endDateNew;
      } else {
        const currentDate = new Date();
        const startDateNew = new Date(startDate);
        const endDateNew = new Date(endDate);
        if (new Date(startDateNew) <= currentDate) {
          return res.status(400).send({
            message: "Start date must be greater than the current date",
          });
        }
        if (endDateNew < startDateNew) {
          return res.status(400).send({
            message:
              "The end date must be greater than or equal to the start date",
          });
        }
        if (dayOfWeek && dayOfWeek !== price.dayOfWeek) {
          price.dayOfWeek = dayOfWeek;
        }
        if (timeSlot && timeSlot !== price.timeSlot) {
          price.timeSlot = timeSlot;
        }
        if (description && description !== price.description) {
          price.description = description;
        }
        if (startDate && startDate !== price.startDate) {
          price.startDate = startDateNew;
        }
        if (endDate && endDate !== price.endDate) {
          price.endDate = endDateNew;
        }
        if (status && status !== price.status) {
          price.status = status;
        }
        if (type && type !== price.type) {
          price.type = type;
        }
      }

      await price.save();
      return res.status(200).send(price);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const priceCode = req.params.code;

      const price = await Price.findOne({ code: priceCode });
      if (!price) {
        return res.status(400).send({ message: "Price not found" });
      }
      price.status = status;
      await price.save();
      return res.status(200).send(price);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  getAll: async (req, res) => {
    try {
      const prices = await Price.find().lean();

      const priceDetails = await PriceDetail.find({
        priceCode: { $in: prices.map((price) => price.code) },
      })
        .populate({
          path: "productCode",
          select: "name code",
          foreignField: "code",
        })
        .populate({
          path: "productTypeCode",
          select: "name code",
          foreignField: "code",
        })
        .populate({
          path: "roomTypeCode",
          select: "name code",
          foreignField: "code",
        })
        .lean();
      // Gộp chi tiết giá với bảng giá
      const pricesWithDetails = prices.map((price) => {
        const details = priceDetails.filter(
          (detail) => detail.priceCode === price.code
        );

        return {
          ...price,
          priceDetails: details,
        };
      });

      res.status(200).json(pricesWithDetails);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  deleteAll: async (req, res) => {
    try {
      await Price.deleteMany({});
      return res
        .status(200)
        .send({ message: "All records deleted successfully." });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
  deleteAllDetail: async (req, res) => {
    try {
      await PriceDetail.deleteMany({});
      return res
        .status(200)
        .send({ message: "All records deleted successfully." });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  addPriceDetailSeat: async (req, res) => {
    try {
      const { productTypeCode, roomTypeCode, priceCode, price, description } =
        req.body;

      const existingPriceSeat = await PriceDetail.findOne({
        productTypeCode: productTypeCode,
        priceCode: priceCode,
        roomTypeCode: roomTypeCode,
      });
      if (existingPriceSeat) {
        return res.status(400).send({
          message: "Price detail for seat already exists",
        });
      }

      // Kiểm tra xem priceCode có tồn tại trong bảng Price không
      const existingPrice = await Price.findOne({ code: priceCode });
      if (!existingPrice) {
        return res.status(404).send({
          message: "Price not found",
        });
      }

      const existingPriceDetail = await ProductType.findOne({
        code: productTypeCode,
      });

      if (!existingPriceDetail) {
        return res.status(400).send({
          message: "Product type for seat already exists",
        });
      }

      const lastPriceDetail = await PriceDetail.findOne().sort({
        priceDetailId: -1,
      });

      let newCode = "CTBG01";
      if (lastPriceDetail) {
        const lastCodeNumber = parseInt(lastPriceDetail.code.substring(4));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `CTBG0${nextCodeNumber}`
            : `CTBG${nextCodeNumber}`;
      }

      // Tạo mới PriceDetail
      const priceDetail = new PriceDetail({
        code: newCode,
        productTypeCode,
        roomTypeCode,
        priceCode,
        price,
        description,
        type: 0, // Đặt loại là ghế
      });

      // Lưu chi tiết giá
      await priceDetail.save();

      return res.status(201).send(priceDetail);
    } catch (error) {
      console.error("Error:", error); // Ghi log thông báo lỗi
      res.status(500).send({ message: error.message });
    }
  },

  addPriceDetailFood: async (req, res) => {
    try {
      const { productCode, priceCode, price, description } = req.body;
      const existingPrice = await Price.findOne({ code: priceCode });
      if (!existingPrice) {
        return res.status(404).send({
          message: "Price not found",
        });
      }

      const existingPriceDetail = await PriceDetail.findOne({
        productCode: productCode,
        priceCode: priceCode,
      });

      if (existingPriceDetail) {
        return res.status(400).send({
          message: "Price detail with this product code already exists.",
        });
      }

      const existingProduct = await Product.findOne({
        code: productCode,
        type: { $ne: 0 },
      });
      if (!existingProduct) {
        return res.status(404).send({
          message: "Product not found",
        });
      }

      const lastPriceDetail = await PriceDetail.findOne().sort({
        priceDetailId: -1,
      });

      let newCode = "CTBG01";
      if (lastPriceDetail) {
        const lastCodeNumber = parseInt(lastPriceDetail.code.substring(4));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `CTBG0${nextCodeNumber}`
            : `CTBG${nextCodeNumber}`;
      }

      const priceDetail = new PriceDetail({
        code: newCode,
        productCode,
        priceCode,
        price,
        description,
        type: 1,
      });
      await priceDetail.save();

      return res.status(201).send(priceDetail);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = priceController;
