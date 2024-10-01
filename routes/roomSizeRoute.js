const roomSizeController = require("../controllers/roomSizeController");

const router = require("express").Router();

router.post("/", roomSizeController.add);
router.get("/", roomSizeController.getAll);
module.exports = router;
