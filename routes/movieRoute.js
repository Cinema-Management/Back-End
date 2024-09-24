const movieController = require("../controllers/movieController");
const router = require("express").Router();
const upload = require("../middleware/imageUploadMiddleware");

router.post("/", upload.single("image"), movieController.add);
router.get("/", movieController.getAll);
router.put("/:code", movieController.update);
module.exports = router;
