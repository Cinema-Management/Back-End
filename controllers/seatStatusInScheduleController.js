const Price = require("../models/Price");
const PriceDetail = require("../models/PriceDetail");
const Product = require("../models/Product");
const Room = require("../models/Room");
const Schedule = require("../models/Schedule");
const SeatStatusInSchedule = require("../models/SeatStatusInSchedule");

function determineTimeSlot(startTime, dayOfWeek) {
  // Nếu là thứ Hai (dayOfWeek = 2), trả về 1 cho 'Cả ngày'
  if (dayOfWeek === 2) {
    return 1; // Cả ngày
  }

  const hour = new Date(startTime).getHours(); // Lấy giờ từ startTime
  if (hour < 17) {
    return 2; // Trước 17h
  }
  return 3; // Sau 17h
}
const seatStatusInScheduleController = {
  add: async (req, res) => {
    try {
      const { scheduleCode } = req.body;

      // Tìm lịch chiếu
      const schedule = await Schedule.findOne({ code: scheduleCode });
      if (!schedule) {
        return res.status(404).send("Schedule not found");
      }

      // Tìm tất cả sản phẩm dựa trên roomCode
      const products = await Product.find({ roomCode: schedule.roomCode });
      if (!products.length) {
        return res.status(404).send("No products found for this room");
      }

      // Kiểm tra xem trạng thái ghế đã tồn tại chưa
      const existingSeatStatus = await SeatStatusInSchedule.find({
        scheduleCode,
        productCode: { $in: products.map((product) => product.code) }, // Lấy mã sản phẩm từ danh sách
      });

      if (existingSeatStatus.length > 0) {
        return res
          .status(400)
          .send("Seat status already exists for this schedule and room.");
      }

      // Tạo trạng thái ghế cho từng sản phẩm
      const seatStatusInSchedules = products.map((product) => {
        const code = `${scheduleCode}-${product.code}`;
        return {
          code,
          productCode: product.code,
          scheduleCode,
        };
      });

      // Lưu tất cả trạng thái ghế vào cơ sở dữ liệu
      const savedSeatStatusInSchedules = await SeatStatusInSchedule.insertMany(
        seatStatusInSchedules
      );

      return res.status(201).send(savedSeatStatusInSchedules);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const seatStatusInSchedule = await SeatStatusInSchedule.find();
      res.status(200).send(seatStatusInSchedule);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  getAllSeatsStatusInScheduleCode: async (req, res) => {
    try {
      const { scheduleCode } = req.query;

      const schedule = await Schedule.findOne({ code: scheduleCode });
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found." });
      }

      const dayOfWeek = schedule.date.getDay();

      const timeSlot = determineTimeSlot(schedule.startTime, dayOfWeek);

      // Tìm các sản phẩm (ghế) với roomCode, type=0 (ghế)
      const seats = await Product.find({
        roomCode: schedule.roomCode,
        type: 0,
      });
      if (!seats || seats.length === 0) {
        return res
          .status(404)
          .json({ message: "No seats found for this room." });
      }

      // Tìm bảng giá chi tiết cho ghế
      const prices = await Price.findOne({
        type: "0", // So sánh với type
        status: 1, // So sánh với status
        dayOfWeek: { $in: [dayOfWeek] }, // So sánh với dayOfWeek
        timeSlot: timeSlot, // So sánh với timeSlot
        startDate: { $lte: schedule.date }, // startDate <= schedule.date
        endDate: { $gte: schedule.date }, // endDate >= schedule.date
      });
      if (!prices) {
        return res.status(200).json([]);
      }

      const priceDetails = await PriceDetail.find({
        priceCode: prices?.code, // So sánh với mã giá
        roomTypeCode: schedule.screeningFormatCode, // So sánh với mã loại phòng
      });

      // Tìm trạng thái ghế từ SeatStatusInSchedule theo scheduleCode
      const seatStatuses = await SeatStatusInSchedule.find({ scheduleCode });
      const seatStatusMap = seatStatuses.reduce((map, status) => {
        map[status.productCode] = status.status; // Tạo bản đồ để dễ dàng tra cứu trạng thái theo productCode
        return map;
      }, {});

      // Gộp giá vào danh sách ghế
      const seatsWithPrices = seats.map((seat) => {
        const priceDetail = priceDetails.find(
          (price) => price.productTypeCode === seat.productTypeCode // Tìm giá tương ứng cho từng ghế
        );

        return {
          ...seat.toObject(), // Chuyển đổi ghế thành đối tượng thuần
          price: priceDetail ? priceDetail.price : 0, // Thêm giá nếu có
          priceDetailCode: priceDetail ? priceDetail.code : null, // Thêm mã giá nếu có
          status: seatStatusMap[seat.code] || null, // Thêm trạng thái từ SeatStatusInSchedule nếu có
          statusSeat: seat.status, // Thêm trạng thái ghế từ Product
        };
      });

      return res.status(200).json(seatsWithPrices);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving seats.", error });
    }
  },

  updateStatusSeat: async (req, res) => {
    try {
      const { scheduleCode, arrayCode, status } = req.body;

      const seatStatuses = await SeatStatusInSchedule.find({
        productCode: { $in: arrayCode },
        scheduleCode: scheduleCode,
      });

      // Kiểm tra xem có trạng thái ghế nào tìm được không
      if (!seatStatuses.length) {
        return res.status(404).send({
          message:
            "No seat statuses found for the given schedule or product codes.",
        });
      }

      // Cập nhật status cho từng trạng thái ghế trong mảng tìm được
      const updatedSeatStatuses = await Promise.all(
        seatStatuses.map(async (item) => {
          // Kiểm tra nếu status là 3 thì không cập nhật
          if (item.status === 3) {
            return item; // Trả về item hiện tại mà không thay đổi
          }

          // Kiểm tra nếu status hiện tại khác status mới thì cập nhật
          if (item.status !== status) {
            item.status = status; // Cập nhật trạng thái
            return await item.save(); // Lưu thay đổi
          }
          return item; // Nếu không thay đổi, trả về item hiện tại
        })
      );

      setTimeout(async () => {
        const { scheduleCode, arrayCode } = req.body;

        const seatStatuses = await SeatStatusInSchedule.find({
          productCode: { $in: arrayCode },
          scheduleCode: scheduleCode,
        });

        const updatedSeatStatuses1 = await Promise.all(
          seatStatuses.map(async (item) => {
            if (item.status === 2) {
              item.status = 1;
              return await item.save();
            }
            return item;
          })
        );

        console.log(
          "Ghế đã được cập nhật:",
          updatedSeatStatuses1.map(
            (item) => item.status + " " + item.productCode
          )
        );
      }, 10 * 60 * 1000); // Sau 10 phút

      return res.status(200).json(updatedSeatStatuses); // Trả về danh sách trạng thái ghế đã được cập nhật
    } catch (error) {
      console.error("Error updating seat status:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  checkSelectedSeatsStatus: async (req, res) => {
    try {
      const { arrayCode, scheduleCode } = req.body; // Lấy danh sách ghế và scheduleCode từ body request

      // Kiểm tra nếu scheduleCode không tồn tại hoặc arraySeat rỗng
      if (!scheduleCode || !arrayCode || arrayCode.length === 0) {
        return res.status(400).send({
          message: "Invalid input: scheduleCode and arraySeat are required.",
        });
      }

      // Tìm tất cả trạng thái ghế với status = 3 và scheduleCode
      const seatStatuses = await SeatStatusInSchedule.find({
        scheduleCode: scheduleCode,
        status: 3,
      });

      // Kiểm tra nếu có ghế nào trong danh sách ghế đã chọn trùng với ghế trong seatStatuses
      const isSeatAvailable = seatStatuses.some((seatStatus) =>
        arrayCode.includes(seatStatus.productCode)
      );

      return res.status(200).json({ available: isSeatAvailable }); // Trả về true hoặc false
    } catch (error) {
      console.error("Error checking seat status:", error); // Log lỗi để kiểm tra
      return res.status(500).json({ message: error.message }); // Trả về lỗi nếu có
    }
  },
};
module.exports = seatStatusInScheduleController;
