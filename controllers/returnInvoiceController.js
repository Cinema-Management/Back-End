const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnInvoiceDetail = require("../models/ReturnInvoiceDetail");
const Schedule = require("../models/Schedule");
const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const Movie = require("../models/Movie");
const User = require("../models/User");
const Cinema = require("../models/Cinema");
const SalesInvoice = require("../models/SalesInvoice");
const SalesInvoiceDetail = require("../models/SalesInvoiceDetail");
const { get } = require("mongoose");

const returnInvoiceController = {
  add: async (req, res) => {
    try {
      const {
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
        salesInvoiceCode,
      } = req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      // Tìm tất cả hóa đơn trả đã tồn tại cho ngày hôm nay
      const invoiceCount = await ReturnInvoice.countDocuments({
        code: { $regex: `^HDT${formattedDate}-` },
      });

      // Tạo mã code mới
      const newInvoiceNumber = invoiceCount + 1; // Tăng số đếm
      const code = `HDT${formattedDate}-${newInvoiceNumber}`; // Định dạng mã

      if (type === 0) {
        const schedule = await Schedule.findOne({ code: scheduleCode });
        if (!schedule) {
          return res.status(404).send({ message: "Schedule not found" });
        }
      }

      const returnInvoice = new ReturnInvoice({
        code,
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
        salesInvoiceCode, // Liên kết với SalesInvoice
      });

      await returnInvoice.save();
      console.log("returnInvoice successfully added");
      return res.status(201).send(returnInvoice);
    } catch (error) {
      return res.status(400).send(error);
    }
  },

  getAll: async (req, res) => {
    try {
      const invoices = await ReturnInvoice.find()
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
              select: "name",
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
        });

      const result = await Promise.all(
        invoices.map(async (invoice) => {
          const details = await ReturnInvoiceDetail.find({
            returnInvoiceCode: invoice.code,
          }).populate({
            path: "productCode",
            select: "name seatNumber type description",
            foreignField: "code",
          });

          return {
            ...invoice.toObject(),
            details,
          };
        })
      );

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getHeaderByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const returnInvoice = await ReturnInvoice.findOne({ code: code });

      if (!returnInvoice) {
        return res.status(404).send({ message: "Return invoice not found" });
      }
      const scheduleCode = returnInvoice.scheduleCode;
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
        returnInvoice: returnInvoice.code,
        cinemaName: cinema.name,
        roomName: room.name,
        roomTypeName: roomType.name,
        movieName: movie.name,
        date: date,
        time: time,
        createdAt: getFormattedDay(returnInvoice.createdAt),
      };

      return res.status(200).json(responseObject);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  returnFullInvoice: async (req, res) => {
    try {
      const {
        salesInvoiceCode,
        staffCode,
        type,
        scheduleCode,
        paymentMethod,
        customerCode,
        returnReason,
      } = req.body;

      console.log("body", req.body);
      const salesInvoice = await SalesInvoice.findOne({
        code: salesInvoiceCode,
        status: 1,
      });

      if (!salesInvoice) {
        return res.status(404).send({ message: "Sales invoice not found" });
      }

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      const invoiceCount = await ReturnInvoice.countDocuments({
        code: { $regex: `^HDT${formattedDate}-` },
      });
      const newInvoiceNumber = invoiceCount + 1;
      const returnInvoiceCode = `HDT${formattedDate}-${newInvoiceNumber}`;

      // Tạo hóa đơn trả
      const returnInvoice = new ReturnInvoice({
        code: returnInvoiceCode,
        staffCode,
        type,
        scheduleCode,
        paymentMethod,
        customerCode,
        returnReason,
        salesInvoiceCode,
      });

      // Lưu hóa đơn trả
      await returnInvoice.save();

      // Tạo chi tiết hóa đơn trả cho từng sản phẩm trong hóa đơn gốc
      const details = await SalesInvoiceDetail.find({ salesInvoiceCode });

      const invoiceCountDetail = await ReturnInvoiceDetail.countDocuments({
        code: { $regex: `^CTHDT${formattedDate}-` },
      });

      // Sử dụng số lượng đã đếm để tạo mã cho từng chi tiết
      const returnDetails = await Promise.all(
        details.map(async (detail, index) => {
          const newInvoiceNumber = invoiceCountDetail + index + 1;
          const code = `CTHDT${formattedDate}-${newInvoiceNumber}`;
          return {
            code,
            returnInvoiceCode: returnInvoice.code,
            productCode: detail.productCode,
            priceDetailCode: detail.priceDetailCode,
            quantity: detail.quantity,
            totalAmount: detail.totalAmount,
            returnReason,
          };
        })
      );

      await ReturnInvoiceDetail.insertMany(returnDetails);
      salesInvoice.status = 0;
      await salesInvoice.save();

      return res.status(201).send(returnInvoice);
    } catch (error) {
      return res.status(400).send({ message: error.message });
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
module.exports = returnInvoiceController;
