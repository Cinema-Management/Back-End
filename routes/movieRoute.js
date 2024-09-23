const movieController = require("../controllers/movieController");
const router = require("express").Router();

router.post("/", movieController.addMovie);
router.get("/", movieController.getAllMovie);
router.put("/:code", movieController.updateMovie);
module.exports = router;
