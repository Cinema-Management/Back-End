const MovieGenre = require("../models/MovieGenre");

const movieGenreController = {
  addMovieGenre: async (req, res) => {
    try {
      const { name } = req.body;

      const existingGenre = await MovieGenre.findOne({ name });
      if (existingGenre) {
        return res
          .status(400)
          .send({ message: "Movie genre name already exists" });
      }

      const lastMovieGenre = await MovieGenre.findOne().sort({ code: -1 });

      let newCode = "MG01";
      if (lastMovieGenre) {
        const lastCodeNumber = parseInt(lastMovieGenre.code.substring(2));
        newCode = `MG${String(lastCodeNumber + 1).padStart(2, "0")}`;
      }

      const movieGenre = new MovieGenre({ code: newCode, name });
      await movieGenre.save();
      return res.status(201).send(movieGenre);
    } catch (error) {
      return res.status(400).send(error);
    }
  },

  getAllMovieGenres: async (req, res) => {
    try {
      const movieGenres = await MovieGenre.find().select("-_id");
      return res.status(200).send(movieGenres);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

module.exports = movieGenreController;
