const returnInvoiceDetailController = require("../controllers/returnInvoiceDetailController");

const router = require("express").Router();

router.get("/", returnInvoiceDetailController.getAll);
router.post("/", returnInvoiceDetailController.add);
module.exports = router;
