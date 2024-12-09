const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const RoomSize = require("../models/RoomSize");
const Cinema = require("../models/Cinema");
const Product = require("../models/Product");
const Schedule = require("../models/Schedule");

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
      const rooms = await Room.findOne({ code: code });
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
      const { code, name, cinemaCode, roomTypeCode, roomSizeCode, status } =
        req.body;

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

      // Cập nhật roomSizeCode
      if (roomSizeCode && roomSizeCode !== room.roomSizeCode) {
        const roomSizeExists = await RoomSize.findOne({ code: roomSizeCode });
        if (!roomSizeExists) {
          return res.status(400).json({
            message: "roomSizeCode not exist!",
          });
        }
        room.roomSizeCode = roomSizeCode;
      }

      // Lưu lại phòng đã cập nhật
      await room.save();

      return res.status(200).send(room);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      const { code } = req.params; // Lấy code của cinema từ URL

      // Tìm kiếm cinema theo code
      const room = await Room.findOne({ code: code });

      // Kiểm tra nếu room không tồn tại
      if (!room) {
        return res.status(404).json({ message: "room not found" });
      }

      // Kiểm tra trạng thái status, chỉ cho phép xóa khi status = 0
      if (room.status !== 0) {
        return res
          .status(400)
          .json({ message: "Active room cannot be deleted" });
      }

      // Xóa mềm cinema (soft delete) bằng mongoose-delete dựa trên code
      const deletedRoom = await Room.delete({ code: code });

      return res.status(200).json({
        message: "Room deleted successfully",
        data: deletedRoom,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting cinema", error });
    }
  },
   checkRoomHasSchedule : async (req, res) => {
    try {
      const { roomCode } = req.params; 
  
      const schedule = await Schedule.findOne({ roomCode });
  
      if (schedule) {
        return res.status(200).json({
          message: "This room is linked to at least one schedule",
          hasSchedule: true,
        });
      } else {
        return res.status(200).json({
          message: "No schedules found for this room",
          hasSchedule: false,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
  restore: async (req, res) => {
    try {
      const { roomCode } = req.params; // Lấy roomCode từ URL
  
      // Khôi phục phòng theo mã roomCode
      const restoredRoom = await Room.restore({ code: roomCode });
      if (!restoredRoom || restoredRoom.nModified === 0) {
        return res.status(404).json({
          message: "Room not found or not deleted",
        });
      }
  
      // Khôi phục tất cả sản phẩm liên quan đến roomCode
      const restoredProducts = await Product.restore({ roomCode });
      if (!restoredProducts || restoredProducts.nModified === 0) {
        return res.status(404).json({
          message: "Room restored, but no deleted products found for this roomCode",
        });
      }
  
      return res.status(200).json({
        message: "Room and related products restored successfully",
        data: {
          restoredRoom,
          restoredProducts,
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error restoring room and products",
        error,
      });
    }
  },
};

module.exports = roomController;
