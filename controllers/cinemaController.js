const Cinema = require("../models/Cinema");

const cinemaController = {
  addCinema: async (req, res) => {
    try {
      const { name, address, status } = req.body;

      const lastCinema = await Cinema.findOne().sort({ code: -1 });

      let newCode = "CIN01";
      if (lastCinema) {
        const lastCodeNumber = parseInt(lastCinema.code.substring(3));

        const nextCodeNumber = (lastCodeNumber + 1).toString().padStart(2, "0");

        newCode = `CIN${nextCodeNumber}`;
      }

      const cinema = new Cinema({
        code: newCode,
        name,
        address,
        status,
      });

      await cinema.save();
      return res.status(201).send(cinema);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
  getAllCinema: async (req, res) => {
    try {
      const cinema = await Cinema.find();
      return res.status(200).send(cinema);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  getActiveCinemas: async (req, res) => {
    try {
      const cinemas = await Cinema.find({ status: 1 });
      return res.status(200).send(cinemas);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },
  updateCinema: async (req, res) => {
    try {
      const { code } = req.params;
      const { name, address, status } = req.body;
      const cinema = await Cinema.findOne({
        code,
      });
      if (name) {
        cinema.name = name;
      }
      if (address) {
        cinema.address = address;
      }
      if (status) {
        cinema.status = status;
      }
      await cinema.save();
      return res.status(200).send(cinema);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
};
module.exports = cinemaController;
