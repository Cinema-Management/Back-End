const movieGenreController = require("../controllers/movieGenreController");

const router = require("express").Router();

router.post("/", movieGenreController.add);
router.get("/", movieGenreController.getAll);
router.put("/:code", movieGenreController.update);

module.exports = router;
