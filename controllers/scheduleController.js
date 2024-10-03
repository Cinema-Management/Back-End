const Schedule = require("../models/Schedule");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Subtitle = require("../models/Subtitle");
const Audio = require("../models/Audio");
const Product = require("../models/Product");
const RoomType = require("../models/RoomType");

const scheduleController = {
  add: async (req, res) => {
    try {
      const {
        movieCode,
        roomCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        date,
        startTime,
      } = req.body;

      // Kiểm tra đầu vào
      if (!movieCode || !roomCode || !date || !startTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Kiểm tra xem movie và room có tồn tại không
      const movie = await Movie.findOne({ code: movieCode });
      if (!movie) {
        return res.status(400).json({ message: "Movie not found" });
      }
      const duration = movie.duration;

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return res.status(400).json({ message: "Room not found" });
      }

      const subtitle = await Subtitle.findOne({ code: subtitleCode });
      if (!subtitle) {
        return res.status(400).json({ message: "Subtitle not found" });
      }

      const audio = await Audio.findOne({ code: audioCode });
      if (!audio) {
        return res.status(400).json({ message: "Audio not found" });
      }

      const roomType = await RoomType.findOne({ code: screeningFormatCode });
      if (!roomType) {
        return res
          .status(400)
          .json({ message: "screeningFormatCode not found" });
      }

      // Kiểm tra thời gian bắt đầu và kết thúc có hợp lệ không
      const start = new Date(startTime);
      const cleaningTime = 15 * 60000; // 15 phút dọn dẹp tính bằng milliseconds

      const end = new Date(start.getTime() + duration * 60000 + cleaningTime);

      if (start >= end) {
        return res
          .status(400)
          .json({ message: "Start time must be before end time" });
      }

      // Kiểm tra xem có lịch chiếu nào cùng phòng và thời gian bị trùng không
      const conflictingSchedules = await Schedule.find({
        roomCode,
        date,
        $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      });

      if (conflictingSchedules.length > 0) {
        return res.status(400).json({
          message: "Schedule conflicts with an existing schedule in this room",
        });
      }

      // Lấy mã rạp từ room
      const cinemaCode = room.cinemaCode;

      // Kiểm tra xem có lịch chiếu của cùng 1 bộ phim trong cùng 1 rạp không
      const conflictingMovieSchedules = await Schedule.find({
        movieCode,
        date,
        roomCode: { $ne: roomCode }, // Phòng khác trong cùng rạp
        startTime: start, // trùng thời gian
      }).populate({
        path: "roomCode",
        match: { cinemaCode }, // Chỉ kiểm tra trong cùng rạp
        model: "Room",
        foreignField: "code",
      });

      if (conflictingMovieSchedules.length > 0) {
        return res.status(400).json({
          message:
            "This movie is already scheduled at the same time in another room in this cinema",
        });
      }

      // Tạo mã lịch chiếu mới
      const lastScheduleType = await Schedule.findOne().sort({
        scheduleId: -1,
      });
      let newCode = "SC01";
      if (lastScheduleType) {
        const lastCodeNumber = parseInt(lastScheduleType.code.substring(2));
        const nextCodeNumber = lastCodeNumber + 1;
        newCode =
          nextCodeNumber < 10 ? `SC0${nextCodeNumber}` : `SC${nextCodeNumber}`;
      }

      // Tạo mới lịch chiếu
      const newSchedule = new Schedule({
        code: newCode,
        movieCode,
        roomCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        date,
        startTime,
        endTime: end,
      });

      await newSchedule.save();

      return res.status(201).json(newSchedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
  getAll: async (req, res) => {
    try {
      const { date } = req.body; // Lấy ngày từ body
      let schedules;

      if (date) {
        // Tạo điều kiện lọc theo ngày
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1); // Thêm 1 ngày để lọc đến cuối ngày

        // Tìm lịch chiếu theo ngày
        schedules = await Schedule.find({
          startTime: { $gte: startOfDay, $lt: endOfDay }, // Giả sử bạn có trường startTime để lưu thời gian bắt đầu
        });
      } else {
        // Nếu không có ngày, trả về tất cả lịch chiếu
        schedules = await Schedule.find();
      }

      return res.json(schedules);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
  getAllRoomsWithSchedules: async (req, res) => {
    try {
      const { cinemaCode } = req.params;
      const { date } = req.query;
      const rooms = await Room.find({ cinemaCode })
        .populate({
          path: "roomTypeCode", // Trường chứa mã loại phòng
          model: "RoomType", // Mô hình RoomType
          select: "code name -_id", // Chỉ lấy trường code và name, loại bỏ _id
          foreignField: "code",
        })
        .populate({
          path: "roomSizeCode", // Trường chứa mã loại phòng
          model: "RoomSize", // Mô hình RoomType
          select: "code name -_id", // Chỉ lấy trường code và name, loại bỏ _id
          foreignField: "code",
        });

      if (rooms.length === 0) {
        return res.status(200).send(rooms);
      }

      // Lặp qua từng phòng và lấy lịch chiếu tương ứng
      const roomsWithSchedules = await Promise.all(
        rooms.map(async (room) => {
          const schedules = await Schedule.find({
            roomCode: room.code,
            date: date,
          })
            .populate({
              path: "movieCode",
              model: "Movie",
              select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "screeningFormatCode",
              model: "RoomType",
              select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "audioCode",
              model: "Audio",
              select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "subtitleCode",
              model: "Subtitle",
              select: "code name -_id",
              foreignField: "code",
            });
          const totalSeats = await Product.countDocuments({
            roomCode: room.code, // Mã phòng
            type: 0, // Loại ghế
          });

          return {
            ...room.toObject(),
            roomTypeName: room.roomTypeCode.map((type) => type.name).join(", "), // Lấy tên loại phòng
            roomSizeName: room.roomSizeCode ? room.roomSizeCode.name : null,
            totalSeats, // Tổng số ghế của phòng
            schedules: schedules, // Thêm danh sách lịch chiếu vào từng phòng
          };
        })
      );

      return res.status(200).json(roomsWithSchedules);
    } catch (error) {
      console.error("Error getting rooms with schedules:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },

  update: async (req, res) => {
    try {
      const { code } = req.params;
      const {
        movieCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        startTime,
        status,
      } = req.body;

      // Tìm lịch chiếu theo code
      const schedule = await Schedule.findOne({ code: code });
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Cập nhật các trường có thay đổi
      if (movieCode) schedule.movieCode = movieCode;
      if (screeningFormatCode)
        schedule.screeningFormatCode = screeningFormatCode;
      if (subtitleCode) schedule.subtitleCode = subtitleCode;
      if (audioCode) schedule.audioCode = audioCode;

      // Cập nhật startTime và tính toán endTime
      if (startTime) {
        const start = new Date(startTime);

        // Lấy thời lượng phim từ movieCode mới (nếu có)
        const movie = await Movie.findOne({
          code: movieCode,
        });
        if (!movie) {
          return res.status(400).json({ message: "Movie not found" });
        }
        const duration = movie.duration;

        // Tính toán thời gian kết thúc dựa trên startTime và thời lượng phim
        const cleaningTime = 15 * 60000; // 15 phút dọn dẹp
        const end = new Date(start.getTime() + duration * 60000 + cleaningTime);

        // Kiểm tra xung đột lịch chiếu trong cùng phòng (vì roomCode đã có sẵn trong schedule)
        const conflictingSchedules = await Schedule.find({
          roomCode: schedule.roomCode,
          date: schedule.date,
          $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
          code: { $ne: code }, // Loại trừ chính lịch chiếu hiện tại
        });

        if (conflictingSchedules.length > 0) {
          return res.status(400).json({
            message:
              "Schedule conflicts with an existing schedule in this room",
          });
        }

        // Kiểm tra xung đột lịch chiếu của cùng phim trong các phòng khác của cùng rạp
        const room = await Room.findOne({ code: schedule.roomCode });
        if (!room) {
          return res.status(400).json({ message: "Room not found" });
        }
        const cinemaCode = room.cinemaCode;

        const conflictingMovieSchedules = await Schedule.find({
          movieCode: schedule.movieCode,
          date: schedule.date,
          roomCode: { $ne: schedule.roomCode },
          startTime: start,
        }).populate({
          path: "roomCode",
          match: { cinemaCode },
          model: "Room",
          foreignField: "code",
        });

        if (conflictingMovieSchedules.length > 0) {
          return res.status(400).json({
            message:
              "This movie is already scheduled at the same time in another room in this cinema",
          });
        }

        // Cập nhật thời gian bắt đầu và kết thúc
        schedule.startTime = startTime;
        schedule.endTime = end.toISOString();
      }

      // Cập nhật status nếu có
      if (status !== undefined) schedule.status = status;

      // Lưu lịch chiếu đã cập nhật
      await schedule.save();

      return res.status(200).json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
};
module.exports = scheduleController;
