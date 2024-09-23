const Movie = require("../models/Movie");
const MovieGenre = require("../models/MovieGenre");

const movieController = {
  addMovie: async (req, res) => {
    try {
      const {
        name,
        movieGenreCode,
        image,
        duration,
        description,
        trailer,
        ageRestriction,
        director,
        cast,
        country,
        startDate,
        endDate,
        status,
      } = req.body;

      const existingMovie = await Movie.findOne({ name });
      if (existingMovie) {
        return res
          .status(400)
          .send({ message: "Movie genre name already exists" });
      }

      const existingGenres = await MovieGenre.find({
        code: { $in: movieGenreCode },
      });
      if (existingGenres.length !== movieGenreCode.length) {
        return res
          .status(400)
          .send({ message: "One or more movie genres do not exist" });
      }

      const lastMovieGenre = await Movie.findOne().sort({
        movieId: -1,
      });

      let newCode = "MV01"; // Giá trị mặc định cho mục đầu tiên
      if (lastMovieGenre) {
        const lastCodeNumber = parseInt(lastMovieGenre.code.substring(2));

        // Tăng số thứ tự
        const nextCodeNumber = lastCodeNumber + 1;

        // Tạo mã mới với định dạng
        newCode =
          nextCodeNumber < 10
            ? `MG0${nextCodeNumber}` // Nếu số nhỏ hơn 10, thêm 0 vào trước
            : `MG${nextCodeNumber}`; // Nếu số lớn hơn hoặc bằng 10, giữ nguyên
      }

      const movie = new Movie({
        code: newCode,
        name,
        movieGenreCode,
        image,
        duration,
        description,
        trailer,
        ageRestriction,
        director,
        cast,
        country,
        startDate,
        endDate,
        status,
      });

      await movie.save();
      return res.status(201).send(movie);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },
  getAllMovie: async (req, res) => {
    try {
      const movies = await Movie.find().populate({
        path: "movieGenreCode",
        model: "MovieGenre",
        foreignField: "code",
      });
      const result = movies.map((movie) => ({
        ...movie.toObject(),
        movieGenreCode: movie.movieGenreCode.map((genre) => ({
          name: genre.name,
        })),
      }));

      return res.status(200).send(result);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  updateMovie: async (req, res) => {
    try {
      const movieCode = req.params.code;
      const {
        name,
        movieGenreCode,
        image,
        duration,
        description,
        trailer,
        ageRestriction,
        director,
        cast,
        country,
        rated,
        startDate,
        endDate,
        status,
      } = req.body;

      const movie = await Movie.findOne({ code: movieCode });
      if (!movie) {
        return res.status(404).send({ message: "Movie not found" });
      }

      // Kiểm tra nếu các mã thể loại phim có tồn tại không
      if (movieGenreCode) {
        const existingGenres = await MovieGenre.find({
          code: { $in: movieGenreCode },
        });
        if (existingGenres.length !== movieGenreCode.length) {
          return res
            .status(400)
            .send({ message: "One or more movie genres do not exist" });
        }
      }

      // Cập nhật thông tin phim
      movie.name = name || movie.name;
      movie.movieGenreCode = movieGenreCode || movie.movieGenreCode;
      movie.image = image || movie.image;
      movie.duration = duration || movie.duration;
      movie.description = description || movie.description;
      movie.trailer = trailer || movie.trailer;
      movie.ageRestriction = ageRestriction || movie.ageRestriction;
      movie.director = director || movie.director;
      movie.country = country || movie.country;
      movie.rated = rated || movie.rated;
      movie.startDate = startDate || movie.startDate;
      movie.endDate = endDate || movie.endDate;
      movie.status = status || movie.status;

      await movie.save();
      return res.status(200).send(movie);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },
};

module.exports = movieController;
