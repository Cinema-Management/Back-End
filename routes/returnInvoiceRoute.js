const returnInvoiceController = require("../controllers/returnInvoiceController");

const router = require("express").Router();

router.get("/:code", returnInvoiceController.getHeaderByCode);
router.get("/", returnInvoiceController.getAll);
router.post("/", returnInvoiceController.returnFullInvoice);

module.exports = router;
