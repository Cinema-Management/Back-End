const priceController = require("../controllers/priceController");
const router = require("express").Router();

router.post("/", priceController.add);
router.post("/addPriceFood", priceController.addPriceFood);
router.post("/addPriceDetailSeat", priceController.addPriceDetailSeat);
router.post("/addPriceDetailProduct", priceController.addPriceDetailFood);
router.post("/copyPrice", priceController.addPriceDetailsForCopy);
router.post("/copyPriceFood", priceController.addPriceFoodDetailsForCopy);
router.post("/:code", priceController.update);
router.post("/updateStatus/:code", priceController.updateStatus);
router.post("/updateDetail/:code", priceController.updateDetail);
router.get("/getPrice", priceController.getPriceDetails);
router.get("/getPriceDetailsFood", priceController.getPriceDetailsFood);
router.get("/getAllPriceFood", priceController.getAllPriceFood);
router.get("/", priceController.getAll);
router.get("/checkPriceDetailForSaleInvoice/:priceCode", priceController.checkPriceDetailForSaleInvoice);
router.delete("/delete", priceController.deleteAll);
router.delete("/deleteDetail", priceController.deleteAllDetail);
router.delete("/deletePrice/:code", priceController.deletePrice);
router.delete("/deletePriceDetail/:code", priceController.deleteDetail);

module.exports = router;
