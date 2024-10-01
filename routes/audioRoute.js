const audioController = require("../controllers/audioController");

const router = require("express").Router();

router.post("/", audioController.add);
router.get("/", audioController.getAll);
module.exports = router;
