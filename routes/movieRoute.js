const movieController = require("../controllers/movieController");
const router = require("express").Router();

router.post("/", movieController.addMovie);
router.get("/", movieController.getAllMovie);

module.exports = router;
