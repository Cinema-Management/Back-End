const Subtitle = require("../models/Subtitle");

const subtitleController = {
  add: async (req, res) => {
    try {
      const { name, description } = req.body;

      const existingName = await Subtitle.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "Subtitle name already exists" });
      }

      const lastSubtitleType = await Subtitle.findOne().sort({
        subtitleId: -1,
      });

      let newCode = "VS01";
      if (lastSubtitleType) {
        const lastCodeNumber = parseInt(lastSubtitleType.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `VS0${nextCodeNumber}` : `VS${nextCodeNumber}`;
      }

      const subtitle = new Subtitle({ code: newCode, name, description });
      await subtitle.save();
      return res.status(201).send(subtitle);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const subtitles = await Subtitle.find();
      return res.status(200).send(subtitles);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = subtitleController;
