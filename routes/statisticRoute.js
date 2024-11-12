const statisticController = require("../controllers/statisticController");

const router = require("express").Router();
router.get("/getStatisticsByStaff", statisticController.getStatisticsByStaff);
router.get(
  "/getStatisticsByCustomer",
  statisticController.getStatisticsByCustomer
);
router.get(
  "/getReturnInvoiceDetailsByCinemaCode",
  statisticController.getReturnInvoiceDetailsByCinemaCode
);
router.get("/getPromotionResult", statisticController.getPromotionResult);
router.get("/getTotalByMovie", statisticController.getTotalByMovie);

module.exports = router;
