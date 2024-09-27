const roomController = require("../controllers/roomController");

const router = require("express").Router();

router.post("/", roomController.add);
router.get("/", roomController.getAll);
router.get("/:cinemaCode", roomController.getAllByCinemaCode);
router.put("/", roomController.update);
module.exports = router;
