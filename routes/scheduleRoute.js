const scheduleController = require("../controllers/scheduleController");

const router = require("express").Router();

router.get("/", scheduleController.getAll);
router.get(
  "/getAllRoomsWithSchedules/:cinemaCode",
  scheduleController.getAllRoomsWithSchedules
);

router.get(
  "/checkRoomHasSchedules/:roomCode",
  scheduleController.checkRoomHasSchedules
);
router.get(
  "/getAllMovieWithSchedules",
  scheduleController.getAllMovieWithSchedules
);

router.get(
  "/getSchedulesByDateAndMovie",
  scheduleController.getSchedulesByDateAndMovie
);
router.get("/:code", scheduleController.checkScheduleByMovieCode);
router.get(
  "/getScheduleByCode/:code",
  scheduleController.checkScheduleByMovieCodeDate
);
router.post("/", scheduleController.add);
router.put("/status/:code", scheduleController.updateStatus);
router.put("/:code", scheduleController.update);
router.delete("/:code", scheduleController.delete);

module.exports = router;
