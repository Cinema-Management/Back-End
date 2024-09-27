const roomTypeController = require("../controllers/roomTypeController");

const router = require("express").Router();

router.post("/", roomTypeController.add);
router.get("/", roomTypeController.getAll);
module.exports = router;
