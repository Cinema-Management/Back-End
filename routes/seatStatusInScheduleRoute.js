const seatStatusInScheduleController = require("../controllers/seatStatusInScheduleController");

const router = require("express").Router();

router.get("/", seatStatusInScheduleController.getAll);
router.get(
  "/getAllSeatsStatusInSchedule",
  seatStatusInScheduleController.getAllSeatsStatusInScheduleCode
);
router.post(
  "/checkSelectedSeatsStatus",
  seatStatusInScheduleController.checkSelectedSeatsStatus
);

router.post("/", seatStatusInScheduleController.add);
router.put("/", seatStatusInScheduleController.updateStatusSeat);

module.exports = router;
