const priceController = require("../controllers/priceController");
const router = require("express").Router();

router.post("/", priceController.add);
router.post("/addPriceFood", priceController.addPriceFood);
router.post("/addPriceDetailSeat", priceController.addPriceDetailSeat);
router.post("/addPriceDetailProduct", priceController.addPriceDetailFood);
router.post("/:code", priceController.update);
router.post("/updateStatus/:code", priceController.updateStatus);
router.get("/", priceController.getAll);
router.delete("/delete", priceController.deleteAll);
router.delete("/deleteDetail", priceController.deleteAllDetail);
module.exports = router;