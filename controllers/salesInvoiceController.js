const SalesInvoice = require("../models/SalesInvoice");
const SalesInvoiceDetail = require("../models/SalesInvoiceDetail");
const Schedule = require("../models/Schedule");
const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const Movie = require("../models/Movie");
const User = require("../models/User");
const Cinema = require("../models/Cinema");
const { get } = require("mongoose");
const PromotionResult = require("../models/PromotionResult");
const PriceDetail = require("../models/PriceDetail");
const HierarchyValue = require("../models/HierarchyValue");
const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnInvoiceDetail = require("../models/ReturnInvoiceDetail");
const Product = require("../models/Product");

const salesInvoiceController = {
  add: async (req, res) => {
    try {
      const { staffCode, customerCode, scheduleCode, paymentMethod, type } =
        req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Tìm mã hóa đơn cuối cùng cho ngày hôm nay
      const lastInvoice = await SalesInvoice.findOne({
        code: { $regex: `^HDB${formattedDate}-` }, // Lọc theo ngày
      }).sort({ salesInvoiceId: -1 });

      let newCode = `HDB${formattedDate}-01`; // Mã mặc định nếu không có hóa đơn nào

      if (lastInvoice) {
        // Tách mã hóa đơn để lấy số
        const lastCodeNumber = parseInt(lastInvoice.code.substring(14));

        // Tăng số lên 1
        const nextCodeNumber = lastCodeNumber + 1;

        // Tạo mã mới với số đã tăng
        newCode =
          nextCodeNumber < 10
            ? `HDB${formattedDate}-0${nextCodeNumber}` // Thêm số 0 nếu nhỏ hơn 10
            : `HDB${formattedDate}-${nextCodeNumber}`;
      }

      if (type === 0) {
        const schedule = await Schedule.findOne({ code: scheduleCode });
        if (!schedule) {
          return res.status(404).send({ message: "Schedule not found" });
        }
      }

      const salesInvoice = new SalesInvoice({
        code: newCode,
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
      });

      await salesInvoice.save();
      return res.status(201).send(salesInvoice);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  addWithDetail: async (req, res) => {
    try {
      const {
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
        salesInvoiceDetails,
      } = req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      const lastInvoice = await SalesInvoice.findOne({
        code: { $regex: `^HDB${formattedDate}-` },
      }).sort({ salesInvoiceId: -1 });

      let newCode = `HDB${formattedDate}-01`;
      if (lastInvoice) {
        const lastCodeNumber = parseInt(lastInvoice.code.substring(14));
        const nextCodeNumber = lastCodeNumber + 1;
        newCode =
          nextCodeNumber < 10
            ? `HDB${formattedDate}-0${nextCodeNumber}`
            : `HDB${formattedDate}-${nextCodeNumber}`;
      }

      if (type === 0) {
        const schedule = await Schedule.findOne({ code: scheduleCode });
        if (!schedule) {
          return res.status(404).send({ message: "Schedule not found" });
        }
      }

      const salesInvoice = new SalesInvoice({
        code: newCode,
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
      });

      await salesInvoice.save();

      const savedDetails = [];
      if (salesInvoiceDetails && Array.isArray(salesInvoiceDetails)) {
        for (const detail of salesInvoiceDetails) {
          const { productCode, priceDetailCode, quantity } = detail;

          const invoiceCount = await SalesInvoiceDetail.countDocuments({
            code: { $regex: `^CTHDB${formattedDate}-` },
          });
          const newInvoiceNumber = invoiceCount + 1;
          const code = `CTHDB${formattedDate}-${newInvoiceNumber}`;

          const priceDetail = await PriceDetail.findOne({
            code: priceDetailCode,
          });
          if (!priceDetail) {
            return res.status(404).send({ message: "Price detail not found" });
          }

          const salesInvoiceDetail = new SalesInvoiceDetail({
            code,
            salesInvoiceCode: newCode,
            productCode,
            priceDetailCode,
            quantity,
          });
          await salesInvoiceDetail.save();
          savedDetails.push(salesInvoiceDetail);
        }
      }

      // Populate related data for the created invoice
      const populatedInvoice = await SalesInvoice.findOne({ code: newCode })
        .populate({
          path: "scheduleCode",
          foreignField: "code",
          populate: [
            {
              path: "roomCode",
              select: "cinemaCode name",
              foreignField: "code",
              populate: {
                path: "cinemaCode",
                select: "name",
                foreignField: "code",
              },
            },
            {
              path: "movieCode",
              select: "name ageRestriction image",
              foreignField: "code",
            },
            {
              path: "screeningFormatCode",
              select: "name",
              foreignField: "code",
            },
            {
              path: "subtitleCode",
              select: "name",
              foreignField: "code",
            },
            {
              path: "audioCode",
              select: "name",
              foreignField: "code",
            },
          ],
        })
        .populate({
          path: "customerCode",
          select: "name phone",
          foreignField: "code",
        });

      const details = await Promise.all(
        savedDetails.map(async (detail) => {
          return await SalesInvoiceDetail.findOne({
            code: detail.code,
          }).populate({
            path: "productCode",
            select: "name seatNumber type description",
            foreignField: "code",
          });
        })
      );

      const promotionResults = await PromotionResult.findOne({
        salesInvoiceCode: newCode,
      }).populate({
        path: "freeProductCode",
        select: "name",
        foreignField: "code",
      });

      const result = {
        ...populatedInvoice.toObject(),
        details,
        discountAmount: promotionResults ? promotionResults.discountAmount : 0,
        freeProductCode: promotionResults
          ? promotionResults.freeProductCode
          : null,
        freeQuantity: promotionResults ? promotionResults.freeQuantity : null,
      };

      return res.status(201).send(result);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const pageSize = 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;
      const filter = {};
      if (req.query.invoiceCode) {
        filter.code = req.query.invoiceCode;
      } else if (req.query.staffCode) {
        filter.staffCode = req.query.staffCode;
      } else if (req.query.status) {
        filter.status = req.query.status;
      } else if (req.query.fromDate && req.query.toDate) {
        const startDate = new Date(req.query.fromDate);
        const endDate = new Date(req.query.toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        filter.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      let invoices = await SalesInvoice.find(filter)
        .sort({ createdAt: -1 })
        .populate({
          path: "scheduleCode",
          foreignField: "code",
          populate: [
            {
              path: "roomCode",
              select: "cinemaCode name",
              foreignField: "code",
              populate: {
                path: "cinemaCode",
                select: "name",
                foreignField: "code",
              },
            },
            {
              path: "movieCode",
              select: "name ageRestriction",
              foreignField: "code",
            },
            {
              path: "screeningFormatCode",
              select: "name",
              foreignField: "code",
            },
          ],
        })
        .populate({
          path: "customerCode",
          select: "name phone",
          foreignField: "code",
        })
        .populate({
          path: "staffCode",
          select: "name phone",
          foreignField: "code",
        })
        .lean();

      if (req.query.movieCode) {
        invoices = invoices.filter((invoice) => {
          const movieCode = invoice.scheduleCode.movieCode;
          return movieCode && movieCode.code === req.query.movieCode;
        });
      }
      if (req.query.customerCode) {
        invoices = invoices.filter((invoice) => {
          const phone = invoice.customerCode
            ? invoice.customerCode.phone
            : null;
          return phone && phone === req.query.customerCode;
        });
      }
      if (req.query.cinemaCode) {
        invoices = invoices.filter((invoice) => {
          const cinemaCode = invoice.scheduleCode.roomCode.cinemaCode.code;
          return cinemaCode && cinemaCode === req.query.cinemaCode;
        });
      }
      const totalInvoices = invoices.length;
      const totalPages = Math.ceil(totalInvoices / pageSize);

      const paginatedInvoices = invoices.slice(skip, skip + pageSize);
      const result = await Promise.all(
        paginatedInvoices.map(async (invoice) => {
          const details = await SalesInvoiceDetail.find({
            salesInvoiceCode: invoice.code,
          })
            .populate({
              path: "productCode",
              select: "name seatNumber type description",
              foreignField: "code",
            })
            .lean();
          const promotionResults = await PromotionResult.findOne({
            salesInvoiceCode: invoice.code,
          });
          const discountAmount = promotionResults
            ? promotionResults.discountAmount
            : 0;
          return {
            ...invoice,
            details,
            discountAmount: discountAmount,
          };
        })
      );

      res.status(200).json({
        items: result,
        totalPages: totalPages,
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
  getHeaderByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const salesInvoice = await SalesInvoice.findOne({ code: code });

      if (!salesInvoice) {
        return res.status(404).send({ message: "Sales invoice not found" });
      }
      const scheduleCode = salesInvoice.scheduleCode;
      const schedule = await Schedule.findOne({ code: scheduleCode });

      const date = getFormattedDay(schedule.date);
      const startTime = getFormattedTime(schedule.startTime);
      const endTime = getFormattedTime(schedule.endTime);

      const time = `${startTime} - ${endTime}`;
      const room = await Room.findOne({ code: schedule.roomCode });
      const roomName = room.name;
      const roomType = await RoomType.findOne({ code: room.roomTypeCode });
      const roomTypeName = roomType.name;
      const movie = await Movie.findOne({ code: schedule.movieCode });
      const movieName = movie.name;
      const cinema = await Cinema.findOne({ code: room.cinemaCode });
      const cinemaName = cinema.name;

      const responseObject = {
        salesInvoice: salesInvoice.code,
        cinemaName: cinema.name,
        roomName: room.name,
        roomTypeName: roomType.name,
        movieName: movie.name,
        date: date,
        time: time,
        createdAt: getFormattedDay(salesInvoice.createdAt),
      };

      return res.status(200).json(responseObject);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  getInvoiceSaleByCustomerCode: async (req, res) => {
    try {
      const { code } = req.params;
      const invoices = await SalesInvoice.find({
        customerCode: code,
      })
        .populate({
          path: "scheduleCode",
          foreignField: "code",
          populate: [
            {
              path: "roomCode",
              select: "cinemaCode name",
              foreignField: "code",
              populate: {
                path: "cinemaCode",
                select: "name",
                foreignField: "code",
              },
            },
            {
              path: "movieCode",
              select: "name ageRestriction image",
              foreignField: "code",
            },
            {
              path: "screeningFormatCode",
              select: "name",
              foreignField: "code",
            },
            {
              path: "subtitleCode",
              select: "name",
              foreignField: "code",
            },
            {
              path: "audioCode",
              select: "name",
              foreignField: "code",
            },
          ],
        })
        .populate({
          path: "customerCode",
          select: "name phone",
          foreignField: "code",
        });
      const result = await Promise.all(
        invoices.map(async (invoice) => {
          const details = await SalesInvoiceDetail.find({
            salesInvoiceCode: invoice.code,
          }).populate({
            path: "productCode",
            select: "name seatNumber type description",
            foreignField: "code",
          });
          const promotionResults = await PromotionResult.findOne({
            salesInvoiceCode: invoice.code,
          }).populate({
            path: "freeProductCode",
            select: "name ",
            foreignField: "code",
          });

          const discountAmount = promotionResults
            ? promotionResults.discountAmount
            : 0;
          const freeProductCode = promotionResults
            ? promotionResults.freeProductCode
            : null;
          const freeQuantity = promotionResults
            ? promotionResults.freeQuantity
            : null;

          return {
            ...invoice.toObject(),
            details,
            discountAmount: discountAmount,
            freeProductCode: freeProductCode,
            freeQuantity: freeQuantity,
          };
        })
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
  deleteWithDetailByDate: async (req, res) => {
    try {
      const { date } = req.query;

      // Tìm và xóa các hóa đơn có mã bắt đầu bằng ngày hôm nay
      const deletedInvoices = await SalesInvoice.deleteMany({
        code: { $regex: `^HDB${date}-` },
      });

      // Tìm và xóa các chi tiết hóa đơn có mã bắt đầu bằng ngày hôm nay
      const deletedInvoiceDetails = await SalesInvoiceDetail.deleteMany({
        code: { $regex: `^CTHDB${date}-` },
      });

      return res.status(200).send({
        message: "Deleted invoices and invoice details for today",
        deletedInvoicesCount: deletedInvoices.deletedCount,
        deletedInvoiceDetailsCount: deletedInvoiceDetails.deletedCount,
      });
    } catch (error) {
      return res.status(500).send({
        message: "Error deleting invoices and invoice details",
        error: error.message,
      });
    }
  },
};

const getFormattedTime = (mongoDate) => {
  const date = new Date(mongoDate);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`; // Định dạng giờ:phút
};

function getFormattedDay(isoString) {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}
const buildFullAddress = async (currentCode, addressParts = []) => {
  const hierarchy = await HierarchyValue.findOne({ code: currentCode });

  if (!hierarchy) {
    return addressParts;
  }
  addressParts.push(hierarchy.name);
  if (hierarchy.parentCode) {
    return await buildFullAddress(hierarchy.parentCode, addressParts);
  }
  return addressParts;
};
module.exports = salesInvoiceController;
