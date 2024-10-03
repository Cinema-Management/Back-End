const scheduleController = require("../controllers/scheduleController");

const router = require("express").Router();

router.get("/", scheduleController.getAll);
router.get(
  "/getAllRoomsWithSchedules/:cinemaCode",
  scheduleController.getAllRoomsWithSchedules
);

router.post("/", scheduleController.add);
router.put("/:code", scheduleController.update);
module.exports = router;
