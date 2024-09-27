const RoomType = require("../models/RoomType");

const roomTypeController = {
  add: async (req, res) => {
    try {
      const { name } = req.body;

      const existingName = await RoomType.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "RoomType name already exists" });
      }

      const lastRoomType = await RoomType.findOne().sort({ roomTypeId: -1 });

      let newCode = "LPC01";
      if (lastRoomType) {
        const lastCodeNumber = parseInt(lastRoomType.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `LPC0${nextCodeNumber}`
            : `LPC${nextCodeNumber}`;
      }

      const roomType = new RoomType({ code: newCode, name });
      await roomType.save();
      return res.status(201).send(roomType);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const roomTypes = await RoomType.find();
      return res.status(200).send(roomTypes);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = roomTypeController;
