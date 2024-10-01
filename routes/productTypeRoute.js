const productTypeController = require("../controllers/productTypeController");

const router = require("express").Router();

router.post("/", productTypeController.add);
router.get("/", productTypeController.getAll);
module.exports = router;
