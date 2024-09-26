const productController = require("../controllers/productController");

const router = require("express").Router();

router.post("/", productController.add);

router.get("/", productController.getAll);

module.exports = router;
