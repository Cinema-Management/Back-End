const productController = require("../controllers/productController");
const upload = require("../middleware/imageUploadMiddleware");
const router = require("express").Router();

router.post("/", upload.single("image"), productController.add);

router.get("/", productController.getAll);
router.get("/getAllNotSeat", productController.getNotSeat);

router.get(
  "/getAllSeatsByRoomCode/:roomCode",
  productController.getAllSeatsByRoomCode
);
router.post("/generateSeat", productController.generateSeat);
router.post("/addCombo", upload.single("image"), productController.addCombo);
router.post(
  "/updateCombo/:code",
  upload.single("image"),
  productController.updateCombo
);
router.post("/updateStatus/:code", productController.updateStatus);
router.post("/:code", upload.single("image"), productController.update);
router.delete("/:code", productController.deleteProduct);
router.delete("/", productController.deleteAllByTypeZero);

module.exports = router;
