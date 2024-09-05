const RoomType = require("../models/RoomType");

const roomTypeController = {
  addRoomType: async (req, res) => {
    try {
      const { name } = req.body;

      const lastRoomType = await RoomType.findOne().sort({ code: -1 });

      let newCode = "RT01";
      if (lastRoomType) {
        const lastCodeNumber = parseInt(lastRoomType.code.substring(2));
        newCode = `RT${String(lastCodeNumber + 1).padStart(2, "0")}`;
      }

      const roomType = new RoomType({ code: newCode, name });
      await roomType.save();
      return res.status(201).send(roomType);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAllRoomTypes: async (req, res) => {
    try {
      const roomTypes = await RoomType.find();
      return res.status(200).send(roomTypes);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = roomTypeController;
