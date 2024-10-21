const promotionResultController = require("../controllers/promotionResultController");
const router = require("express").Router();
router.get(
  "/:salesInvoiceCode",
  promotionResultController.getBySalesInvoiceCode
);
router.get("/", promotionResultController.getAll);

router.post("/", promotionResultController.add);

module.exports = router;
