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
      console.log(lastInvoice);

      if (lastInvoice) {
        // Tách mã hóa đơn để lấy số
        const lastCodeNumber = parseInt(lastInvoice.code.substring(14)); // Lấy phần cuối cùng
        console.log(lastCodeNumber);

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
  getAll: async (req, res) => {
    try {
      const invoices = await SalesInvoice.find()
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
          });
          const discountAmount = promotionResults
            ? promotionResults.discountAmount
            : 0;
          return {
            ...invoice.toObject(),
            details,
            discountAmount: discountAmount,
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
      console.log(code);
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
          });
          const discountAmount = promotionResults
            ? promotionResults.discountAmount
            : 0;
          return {
            ...invoice.toObject(),
            details,
            discountAmount: discountAmount,
          };
        })
      );

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

const getFormattedTime = (mongoDate) => {
  const date = new Date(mongoDate); // Chuyển MongoDB date về đối tượng Date JavaScript

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

module.exports = salesInvoiceController;
