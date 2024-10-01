const subtitleController = require("../controllers/subtitleController");

const router = require("express").Router();

router.post("/", subtitleController.add);
router.get("/", subtitleController.getAll);
module.exports = router;
