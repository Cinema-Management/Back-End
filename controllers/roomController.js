const Room = require("../models/Room");

const roomController = {
  addRoom: async (req, res) => {
    try {
      const {
        name,
        roomTypeCode,
        cinemaCode,
        quantityColum,
        quantityRow,
        status,
      } = req.body;

      // Tìm phòng cuối cùng theo mã code
      const lastRoom = await Room.findOne().sort({ code: -1 });

      let newCode = "ROOM01";
      if (lastRoom) {
        // Tách phần số của mã code từ phòng cuối cùng
        const lastCodeNumber = parseInt(lastRoom.code.replace("ROOM", ""));

        // Tăng số lên 1 và thêm vào mã mới
        const nextCodeNumber = (lastCodeNumber + 1).toString().padStart(2, "0");

        newCode = `ROOM${nextCodeNumber}`;
      }

      const room = new Room({
        code: newCode,
        name,
        roomTypeCode,
        cinemaCode,
        quantityColum,
        quantityRow,
        status,
      });

      await room.save();
      return res.status(201).send(room);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },

  getAllRoom: async (req, res) => {
    try {
      const rooms = await Room.find();
      return res.status(200).send(rooms);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },
};

module.exports = roomController;
