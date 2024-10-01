const RoomSize = require("../models/RoomSize");

const roomTypeController = {
  add: async (req, res) => {
    try {
      const { name, description } = req.body;

      const existingName = await RoomSize.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "RoomSize name already exists" });
      }

      const lastRoomType = await RoomSize.findOne().sort({ roomSizeId: -1 });

      let newCode = "KCP01";
      if (lastRoomType) {
        const lastCodeNumber = parseInt(lastRoomType.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `KCP0${nextCodeNumber}`
            : `KCP${nextCodeNumber}`;
      }

      const roomSize = new RoomSize({ code: newCode, name, description });
      await roomSize.save();
      return res.status(201).send(roomSize);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const roomTypes = await RoomSize.find();
      return res.status(200).send(roomTypes);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = roomTypeController;
