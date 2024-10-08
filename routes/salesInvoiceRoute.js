const salesInvoiceController = require("../controllers/salesInvoiceController");

const router = require("express").Router();

router.get("/:code", salesInvoiceController.getHeaderByCode);
router.get("/", salesInvoiceController.getAll);
router.post("/", salesInvoiceController.add);

module.exports = router;
