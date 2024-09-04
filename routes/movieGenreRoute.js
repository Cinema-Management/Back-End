const movieGenreController = require("../controllers/movieGenreController");

const router = require("express").Router();

router.post("/", movieGenreController.addMovieGenre);
router.get("/", movieGenreController.getAllMovieGenres);

module.exports = router;
