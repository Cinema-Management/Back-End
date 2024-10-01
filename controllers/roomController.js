const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const RoomSize = require("../models/RoomSize");
const Cinema = require("../models/Cinema");
const Product = require("../models/Product");

const roomController = {
  add: async (req, res) => {
    try {
      const { name, cinemaCode, roomSizeCode } = req.body;

      // Tìm phòng cuối cùng theo mã code

      let roomTypeCode = req.body.roomTypeCode;
      if (typeof roomTypeCode === "string") {
        roomTypeCode = [roomTypeCode];
      } else if (!Array.isArray(roomTypeCode)) {
        roomTypeCode = [];
      }

      const roomTypeExists = await RoomType.find({
        code: { $in: roomTypeCode },
      });

      if (roomTypeExists.length !== roomTypeCode.length) {
        return res.status(400).json({
          message: "RoomTypeCode not exist! ",
        });
      }

      const roomSizeExists = await RoomSize.findOne({ code: roomSizeCode });
      if (!roomSizeExists) {
        return res.status(400).json({
          message: "roomSizeCode not exist!",
        });
      }

      const cinemaExists = await Cinema.findOne({ code: cinemaCode });
      if (!cinemaExists) {
        return res.status(400).json({
          message: "cinemaCode not exist! ",
        });
      }

      const lastRoom = await Room.findOne().sort({ roomId: -1 });

      let newCode = "PHONG01";
      if (lastRoom) {
        const lastCodeNumber = parseInt(lastRoom.code.substring(5));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `PHONG0${nextCodeNumber}`
            : `PHONG${nextCodeNumber}`;
      }

      const room = new Room({
        code: newCode,
        name,
        roomTypeCode,
        cinemaCode,
        roomSizeCode,
      });

      await room.save();
      return res.status(201).send(room);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const rooms = await Room.find();
      return res.status(200).send(rooms);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },

  getAllByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const rooms = await Room.find({ code: code });
      return res.status(200).send(rooms);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },

  getAllByCinemaCode: async (req, res) => {
    try {
      const { cinemaCode } = req.params; // Lấy cinemaCode từ params

      // Tìm các phòng theo cinemaCode và populate để lấy thông tin loại phòng
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

      // Kiểm tra xem có phòng nào không
      if (rooms.length === 0) {
        return res.status(200).send(rooms);
      }

      // Định dạng lại kết quả để trả về tên loại phòng
      const formattedRooms = await Promise.all(
        rooms.map(async (room) => {
          // Đếm số lượng ghế trong Product dựa vào roomCode và type = 0 (loại ghế)
          const totalSeats = await Product.countDocuments({
            roomCode: room.code, // Mã phòng
            type: 0, // Loại ghế
          });

          return {
            ...room.toObject(), // Chuyển đổi sang đối tượng
            roomTypeName: room.roomTypeCode.map((type) => type.name).join(", "), // Lấy tên loại phòng
            roomSizeName: room.roomSizeCode ? room.roomSizeCode.name : null,
            totalSeats, // Tổng số ghế của phòng
          };
        })
      );

      return res.status(200).send(formattedRooms);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { code, name, cinemaCode, roomTypeCode, status } = req.body;

      // Tìm phòng theo mã code
      const room = await Room.findOne({ code });
      if (!room) {
        return res.status(404).json({
          message: "Room not found!",
        });
      }

      // Chỉ cập nhật các trường nếu giá trị mới khác với giá trị cũ
      if (name && name !== room.name) {
        room.name = name;
      }

      if (cinemaCode && cinemaCode !== room.cinemaCode) {
        const cinemaExists = await Cinema.findOne({ code: cinemaCode });
        if (!cinemaExists) {
          return res.status(400).json({
            message: "cinemaCode not exist!",
          });
        }
        room.cinemaCode = cinemaCode;
      }

      if (
        status !== undefined &&
        status !== room.status &&
        status !== null &&
        status !== ""
      ) {
        room.status = status;
      }

      // Cập nhật roomTypeCode
      if (roomTypeCode) {
        let updatedRoomTypeCode = Array.isArray(roomTypeCode)
          ? roomTypeCode
          : [roomTypeCode];

        const roomTypeExists = await RoomType.find({
          code: { $in: updatedRoomTypeCode },
        });

        if (roomTypeExists.length !== updatedRoomTypeCode.length) {
          return res.status(400).json({
            message: "RoomTypeCode not exist!",
          });
        }

        room.roomTypeCode = updatedRoomTypeCode;
      }

      // Lưu lại phòng đã cập nhật
      await room.save();

      return res.status(200).send(room);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
};

module.exports = roomController;
