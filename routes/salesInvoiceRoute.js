const salesInvoiceController = require("../controllers/salesInvoiceController");

const router = require("express").Router();

router.get("/:code", salesInvoiceController.getHeaderByCode);
router.get("/", salesInvoiceController.getAll);
router.post("/", salesInvoiceController.add);
router.post("/addWithDetail", salesInvoiceController.addWithDetail);
router.get(
  "/invoiceSaleByCustomerCode/:code",
  salesInvoiceController.getInvoiceSaleByCustomerCode
);
router.delete(
  "/deleteWithDetailByDate",
  salesInvoiceController.deleteWithDetailByDate
);

module.exports = router;
