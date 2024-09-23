const movieController = require("../controllers/movieController");
const router = require("express").Router();

router.post("/", movieController.add);
router.get("/", movieController.getAll);
router.put("/:code", movieController.update);
module.exports = router;
