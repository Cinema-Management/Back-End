const Audio = require("../models/Audio");

const audioController = {
  add: async (req, res) => {
    try {
      const { name, description } = req.body;

      const existingName = await Audio.findOne({ name });
      if (existingName) {
        return res.status(400).send({ message: "Audio name already exists" });
      }

      const lastAudioType = await Audio.findOne().sort({ audioId: -1 });

      let newCode = "AT01";
      if (lastAudioType) {
        const lastCodeNumber = parseInt(lastAudioType.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `AT0${nextCodeNumber}` : `AT${nextCodeNumber}`;
      }

      const audio = new Audio({ code: newCode, name, description });
      await audio.save();
      return res.status(201).send(audio);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const audios = await Audio.find();
      return res.status(200).send(audios);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = audioController;
