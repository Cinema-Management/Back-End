const productController = require("../controllers/productController");
const upload = require("../middleware/imageUploadMiddleware");
const router = require("express").Router();

router.post("/", upload.single("image"), productController.add);

router.get("/", productController.getAll);
router.get("/getAllNotSeat", productController.getNotSeat);

router.post("/:code", upload.single("image"), productController.update);
module.exports = router;
