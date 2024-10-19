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
      // Lấy Price cuối cùng dựa trên priceId, bao gồm cả những Price đã bị xóa mềm
      const lastPriceArray = await Price.findWithDeleted()
        .sort({ priceId: -1 })
        .limit(1)
        .lean();
      const lastPrice = lastPriceArray[0];

      let newCode = "BG01";
      if (lastPrice && lastPrice.code) {
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

      const lastPriceArray = await Price.findWithDeleted()
        .sort({ priceId: -1 })
        .limit(1)
        .lean();
      const lastPrice = lastPriceArray[0];

      let newCode = "BG01";
      if (lastPrice && lastPrice.code) {
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

      const price = await Price.findOne({ code: priceCode });
      if (!price) {
        return res.status(404).send({ message: "Price not found" });
      }

      if (price.status === 1) {
        const currentDate = new Date();
        const startDateNew = new Date(startDate);
        const endDateNew = new Date(endDate);
        const currentDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );
        const endDay = new Date(
          endDateNew.getFullYear(),
          endDateNew.getMonth(),
          endDateNew.getDate()
        );

        if (endDay < currentDay) {
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
      console.log(price);
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
          path: "priceCode",
          select: "name code status",
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
          (detail) => detail.priceCode.code === price.code
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

  deletePrice: async (req, res) => {
    try {
      const priceCode = req.params.code;
      const price = await Price.findOne({
        code: priceCode,
      });
      if (!price) {
        return res.status(404).send({
          message: "Price not found",
        });
      }

      console.log(priceCode);
      if (price.status === 1) {
        return res.status(400).send({
          message: "Price is active, cannot be deleted",
        });
      }
      await PriceDetail.deleteMany({
        priceCode: priceCode,
      });

      await price.delete({ code: priceCode });
      return res.status(200).send({ message: "Price deleted successfully" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
  deleteDetail: async (req, res) => {
    try {
      const priceDetailCode = req.params.code;
      const priceDetail = await PriceDetail.findOne({
        code: priceDetailCode,
      }).populate({
        path: "priceCode",
        select: "status",
        foreignField: "code",
      });

      console.log(priceDetail);
      if (!priceDetail) {
        return res.status(404).send({
          message: "Price detail not found",
        });
      }
      if (priceDetail.priceCode.status === 1) {
        return res.status(400).send({
          message: "Price is active, cannot be deleted",
        });
      }

      await priceDetail.delete({ code: priceDetailCode });
      return res
        .status(200)
        .send({ message: "Price detail deleted successfully" });
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
        return res.status(401).send({
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

      const lastPriceDetailArray = await PriceDetail.findWithDeleted()
        .sort({
          priceDetailId: -1,
        })
        .limit(1)
        .lean();

      const lastPriceDetail = lastPriceDetailArray[0];
      let newCode = "CTBG01";
      if (lastPriceDetail && lastPriceDetail.code) {
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

      const lastPriceDetailArray = await PriceDetail.findWithDeleted()
        .sort({
          priceDetailId: -1,
        })
        .limit(1)
        .lean();

      const lastPriceDetail = lastPriceDetailArray[0];
      let newCode = "CTBG01";
      if (lastPriceDetail && lastPriceDetail.code) {
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

  getPriceDetails: async (req, res) => {
    const { dayOfWeek, timeSlot, productTypeCode, roomTypeCode } = req.query;

    try {
      const priceDetails = await PriceDetail.find({
        productTypeCode: productTypeCode,
        roomTypeCode: roomTypeCode,
      }).populate({
        path: "priceCode",
        match: {
          status: 1,
          type: 0,
        },
        select:
          "code description dayOfWeek status timeSlot startDate endDate type",
        foreignField: "code",
      });

      if (!priceDetails || priceDetails.length === 0) {
        return res.status(400).send({
          message: "No price details found for the specified criteria.",
        });
      }

      const filteredPriceDetails = priceDetails.filter((priceDetail) => {
        if (priceDetail.priceCode && priceDetail.priceCode.dayOfWeek) {
          return (
            priceDetail.priceCode.dayOfWeek.includes(Number(dayOfWeek)) &&
            priceDetail.priceCode.timeSlot === Number(timeSlot)
          );
        }
        return false;
      });

      if (!filteredPriceDetails || filteredPriceDetails.length === 0) {
        return res.status(400).send({
          message: "No price details found for the specified criteria.",
        });
      }

      return res.status(200).json(filteredPriceDetails);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getPriceDetailsFood: async (req, res) => {
    const { productCode } = req.query;
    console.log(productCode);
    try {
      const priceDetails = await PriceDetail.find({
        productCode: productCode,
      }).populate({
        path: "priceCode",
        match: {
          status: 1,
          type: 1,
        },
        select: "code name status startDate endDate type",
        foreignField: "code",
      });

      console.log("Price Details:", priceDetails);

      if (
        !priceDetails ||
        priceDetails.length === 0 ||
        !priceDetails[0].priceCode
      ) {
        return res.status(400).send({
          message: "No price details found for the specified criteria.",
        });
      }

      return res.status(200).json(priceDetails);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getAllPriceFood: async (req, res) => {
    try {
      const { date } = req.query;
      const currentDate = new Date(date);
      // Bước 1: Tìm các sản phẩm không phải ghế
      const products = await Product.find({ type: { $ne: 0 }, status: 1 });

      // Bước 2: Lấy ngày hiện tại

      // Bước 3: Lấy tất cả các mức giá còn hiệu lực
      const prices = await Price.find({
        type: "1",
        status: 1,
        startDate: { $lte: currentDate }, // Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hiện tại
        endDate: { $gte: currentDate }, // Ngày kết thúc phải lớn hơn hoặc bằng ngày hiện tại
      });

      // Bước 4: Lấy mã giá
      const priceCodes = prices.map((price) => price.code);

      // Bước 5: Lấy chi tiết giá theo mã giá
      const priceDetails = await PriceDetail.find({
        priceCode: { $in: priceCodes }, // Tìm tất cả priceDetail có priceCode trong mảng
      });

      // Bước 6: Kết hợp sản phẩm với giá
      const resultPrice = priceDetails.map((priceDetail) => {
        // Tìm sản phẩm tương ứng với từng chi tiết giá
        const product = products.find(
          (product) => product.code === priceDetail.productCode // So sánh mã sản phẩm
        );

        return {
          ...priceDetail.toObject(), // Chuyển đổi chi tiết giá thành đối tượng thuần
          productName: product ? product.name : null, // Thêm tên sản phẩm nếu tìm thấy
          descriptionProduct: product ? product.description : null, // Thêm mô tả sản phẩm nếu tìm thấy
          image: product ? product.image : null, // Thêm ảnh sản phẩm nếu tìm thấy
        };
      });
      const resultPriceFilter = resultPrice.filter(
        (item) => item.productName !== null
      );

      // Bước 7: Gửi kết quả về client
      res.json(resultPriceFilter);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateDetail: async (req, res) => {
    try {
      const {
        price,
        description,
        productTypeCode,
        roomTypeCode,
        productCode,
        type,
      } = req.body;
      const priceDetailCode = req.params.code;

      const priceDetail = await PriceDetail.findOne({ code: priceDetailCode });
      if (!priceDetail) {
        return res.status(404).send({ message: "Price detail not found" });
      }

      if (productCode && productCode !== priceDetail.productCode) {
        priceDetail.productCode = productCode;
      }
      if (productTypeCode && productTypeCode !== priceDetail.productTypeCode) {
        priceDetail.productTypeCode = productTypeCode;
      }
      if (roomTypeCode && roomTypeCode !== priceDetail.roomTypeCode) {
        priceDetail.roomTypeCode = roomTypeCode;
      }

      if (price && price !== priceDetail.price) {
        priceDetail.price = price;
      }
      if (description && description !== priceDetail.description) {
        priceDetail.description = description;
      }

      await priceDetail.save();
      return res.status(200).send(priceDetail);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = priceController;
