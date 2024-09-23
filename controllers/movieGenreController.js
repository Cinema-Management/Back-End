const MovieGenre = require("../models/MovieGenre");
const { updateMovie } = require("./movieController");

const movieGenreController = {
  add: async (req, res) => {
    try {
      const { name } = req.body;

      const existingGenre = await MovieGenre.findOne({ name });
      if (existingGenre) {
        return res
          .status(400)
          .send({ message: "Movie genre name already exists" });
      }

      const lastMovieGenre = await MovieGenre.findOne().sort({
        movieGenreId: -1,
      });

      let newCode = "TLP01";
      if (lastMovieGenre) {
        const lastCodeNumber = parseInt(lastMovieGenre.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `TLP0${nextCodeNumber}`
            : `TPL${nextCodeNumber}`;
      }

      const movieGenre = new MovieGenre({ code: newCode, name });
      await movieGenre.save();

      return res.status(201).send(movieGenre);
    } catch (error) {
      return res.status(400).send(error);
    }
  },

  getAll: async (req, res) => {
    try {
      const movieGenres = await MovieGenre.find();
      return res.status(200).send(movieGenres);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  update: async (req, res) => {
    try {
      const code = req.params.code;
      const { name } = req.body;

      const movieGenre = await MovieGenre.findOne({ code: code });
      if (!movieGenre) {
        return res.status(404).send({ message: "Movie genre not found" });
      }

      const existingName = await MovieGenre.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "Movie genre name already exists" });
      }

      movieGenre.name = name;
      await movieGenre.save();

      return res.status(200).send(movieGenre);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

module.exports = movieGenreController;
