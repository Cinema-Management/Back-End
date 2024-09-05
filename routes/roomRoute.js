const roomController = require("../controllers/roomController");

const router = require("express").Router();

router.post("/", roomController.addRoom);
router.get("/", roomController.getAllRoom);
module.exports = router;
