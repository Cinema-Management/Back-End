const SalesInvoice = require("../models/SalesInvoice");
const Schedule = require("../models/Schedule");
const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const Movie = require("../models/Movie");
const User = require("../models/User");
const Cinema = require("../models/Cinema");

const salesInvoiceController = {
  add: async (req, res) => {
    try {
      const { staffCode, customerCode, scheduleCode, paymentMethod, type } =
        req.body;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Tìm tất cả hóa đơn đã tồn tại cho ngày hôm nay
      const invoiceCount = await SalesInvoice.countDocuments({
        code: { $regex: `^HDB${formattedDate}-` }, // Sửa regex để khớp định dạng HDBYYYY-MM-DD-
      });

      // Tạo mã code mới
      const newInvoiceNumber = invoiceCount + 1; // Tăng số đếm

      const code = `HDB${formattedDate}-${newInvoiceNumber}`; // Định dạng mã

      if (type === 0) {
        const schedule = await Schedule.findOne({ code: scheduleCode });
        if (!schedule) {
          return res.status(404).send({ message: "Schedule not found" });
        }
      }

      const salesInvoice = new SalesInvoice({
        code,
        staffCode,
        customerCode,
        scheduleCode,
        paymentMethod,
        type,
      });

      await salesInvoice.save();
      console.log("salesInvoice successfully added");
      return res.status(201).send(salesInvoice);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const salesInvoices = await SalesInvoice.find();
      return res.json(salesInvoices);
    } catch (error) {
      return res.status(500).json({ message: error.message });
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
