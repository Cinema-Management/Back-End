const cinemaController = require("../controllers/cinemaController");

const router = require("express").Router();

router.post("/", cinemaController.add);
router.get("/", cinemaController.getAll);
router.get("/getAllFullAddress", cinemaController.getAllFullAddress);

router.put("/:code", cinemaController.update);
module.exports = router;
