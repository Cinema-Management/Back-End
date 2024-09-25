const Movie = require("../models/Movie");
const MovieGenre = require("../models/MovieGenre");
const uploadImageS3 = require("./upLoadImageS3Controller");

const movieController = {
  add: async (req, res) => {
    try {
      const {
        name,
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

      let movieGenreCode = req.body.movieGenreCode;
      if (typeof movieGenreCode === "string") {
        movieGenreCode = [movieGenreCode];
      } else if (!Array.isArray(movieGenreCode)) {
        movieGenreCode = [];
      }

      const existingMovie = await Movie.findOne({ name });
      if (existingMovie) {
        return res.status(400).send({ message: "Movie name already exists" });
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

      let newCode = "PHIM01";
      if (lastMovieGenre) {
        const lastCodeNumber = parseInt(lastMovieGenre.code.substring(4));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `PHIM0${nextCodeNumber}`
            : `PHIM${nextCodeNumber}`;
      }

      let imageUrl = "";
      if (req.file) {
        imageUrl = await uploadImageS3(req.file); // Gọi hàm upload ảnh
      }

      const movie = new Movie({
        code: newCode,
        name,
        movieGenreCode,
        image: imageUrl,
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
  getAll: async (req, res) => {
    try {
      const movies = await Movie.find().populate({
        path: "movieGenreCode",
        model: "MovieGenre",
        foreignField: "code",
      });
      const result = movies.map((movie) => ({
        ...movie.toObject(),
        movieGenreCode: movie.movieGenreCode.map((genre) => ({
          // code: genre.code,
          name: genre.name,
        })),
      }));

      return res.status(200).send(result);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  update: async (req, res) => {
    try {
      const movieCode = req.params.code;
      const {
        name,
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

      const movie = await Movie.findOne({ code: movieCode });
      if (!movie) {
        return res.status(404).send({ message: "Movie not found" });
      }

      // Kiểm tra nếu các mã thể loại phim có tồn tại không

      let movieGenreCode = req.body.movieGenreCode;
      if (typeof movieGenreCode === "string") {
        movieGenreCode = [movieGenreCode];
      } else if (!Array.isArray(movieGenreCode)) {
        movieGenreCode = [];
      }

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

      let imageUrl = movie.image; // Giữ nguyên giá trị cũ nếu không có thay đổi
      if (req.file) {
        imageUrl = await uploadImageS3(req.file); // Upload ảnh mới
      }

      // Chỉ update những giá trị mới (có thay đổi)
      if (name && name !== movie.name) {
        movie.name = name;
      }

      if (
        Array.isArray(movieGenreCode) &&
        movieGenreCode.length > 0 &&
        movieGenreCode !== movie.movieGenreCode
      ) {
        movie.movieGenreCode = movieGenreCode;
      }

      if (imageUrl !== movie.image) {
        movie.image = imageUrl;
      }

      if (duration && duration !== movie.duration) {
        movie.duration = duration;
      }

      if (description && description !== movie.description) {
        movie.description = description;
      }

      if (trailer && trailer !== movie.trailer) {
        movie.trailer = trailer;
      }

      if (ageRestriction && ageRestriction !== movie.ageRestriction) {
        movie.ageRestriction = ageRestriction;
      }

      if (director && director !== movie.director) {
        movie.director = director;
      }

      if (country && country !== movie.country) {
        movie.country = country;
      }

      if (cast && cast !== movie.cast) {
        movie.cast = cast;
      }

      if (startDate && startDate !== movie.startDate) {
        movie.startDate = startDate;
      }

      if (endDate && endDate !== movie.endDate) {
        movie.endDate = endDate;
      }

      if (
        status !== undefined &&
        status !== movie.status &&
        status !== null &&
        status !== ""
      ) {
        movie.status = status;
      }

      await movie.save();
      return res.status(200).send(movie);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },
};

module.exports = movieController;
