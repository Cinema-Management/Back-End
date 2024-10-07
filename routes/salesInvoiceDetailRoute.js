const salesInvoiceDetailController = require("../controllers/salesInvoiceDetailController");

const router = require("express").Router();

router.get("/", salesInvoiceDetailController.getAll);
router.post("/", salesInvoiceDetailController.add);
module.exports = router;
