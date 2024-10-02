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
      const duration = movie.duration;
      const room = await Room.findOne({ code: roomCode });

      if (!movie) {
        return res.status(400).json({ message: "Movie not found" });
      }

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
      const end = new Date(start.getTime() + duration * 60000); // 60000 ms = 1 phút

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
        return res
          .status(400)
          .json({ message: "Schedule conflicts with an existing schedule" });
      }

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
      const schedules = await Schedule.find();
      return res.json(schedules);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAllRoomsWithSchedules: async (req, res) => {
    try {
      const { cinemaCode } = req.params;
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
};
module.exports = scheduleController;
