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

      // Tìm thể loại phim cuối cùng theo movieGenreId
      const lastMovieGenre = await MovieGenre.findOne().sort({
        movieGenreId: -1,
      });

      let newCode = "TLP01"; // Giá trị mặc định cho mục đầu tiên
      if (lastMovieGenre) {
        const lastCodeNumber = parseInt(lastMovieGenre.code.substring(3));

        // Tăng số thứ tự
        const nextCodeNumber = lastCodeNumber + 1;

        // Tạo mã mới với định dạng
        newCode =
          nextCodeNumber < 10
            ? `TLP0${nextCodeNumber}` // Nếu số nhỏ hơn 10, thêm 0 vào trước
            : `TPL${nextCodeNumber}`; // Nếu số lớn hơn hoặc bằng 10, giữ nguyên
      }

      // Tạo thể loại phim mới
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
