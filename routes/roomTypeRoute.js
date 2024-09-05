const roomTypeController = require("../controllers/roomTypeController");

const router = require("express").Router();

router.post("/", roomTypeController.addRoomType);
router.get("/", roomTypeController.getAllRoomTypes);
module.exports = router;
