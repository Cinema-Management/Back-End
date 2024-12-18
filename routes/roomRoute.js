const roomController = require("../controllers/roomController");

const router = require("express").Router();

router.post("/", roomController.add);
router.get("/", roomController.getAll);
router.get("/getAll/:code", roomController.getAllByCode);
router.get("/:cinemaCode", roomController.getAllByCinemaCode);
router.get("/checkRoomHasSchedule/:roomCode", roomController.checkRoomHasSchedule);
router.delete("/:code", roomController.delete);
router.put("/", roomController.update);
router.patch("/:roomCode", roomController.restore);
module.exports = router;
