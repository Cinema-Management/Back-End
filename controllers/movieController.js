const Movie = require("../models/Movie");

const movieController = {
  addMovie: async (req, res) => {
    try {
      const {
        code,
        genres_code,
        name,
        poster,
        ageRestriction,
        duration,
        description,
        trailer,
        director,
        cast,
        country,
        rated,
        startDate,
        endDate,
        status,
      } = req.body;

      const movie = new Movie({
        code,
        genres_code,
        name,
        poster,
        ageRestriction,
        duration,
        description,
        trailer,
        director,
        cast,
        country,
        rated,
        startDate,
        endDate,
        status,
      });

      // Lưu phim vào cơ sở dữ liệu
      await movie.save();
      return res.status(201).send(movie);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
  getAllMovie: async (req, res) => {
    try {
      const movie = await Movie.find();
      return res.status(200).send(movie);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

module.exports = movieController;
