const MovieGenre = require("../models/MovieGenre");

const movieGenreController = {
  addMovieGenre: async (req, res) => {
    try {
      const { name } = req.body;

      // Kiểm tra xem thể loại đã tồn tại chưa
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

      let newCode = "MG01"; // Giá trị mặc định cho mục đầu tiên
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

      // Tạo thể loại phim mới
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
