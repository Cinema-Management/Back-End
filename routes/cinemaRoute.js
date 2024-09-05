const cinemaController = require("../controllers/cinemaController");

const router = require("express").Router();

router.post("/", cinemaController.addCinema);
router.get("/", cinemaController.getAllCinema);
router.put("/:code", cinemaController.updateCinema);
module.exports = router;
