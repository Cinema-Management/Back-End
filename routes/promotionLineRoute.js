const promotionLineController = require("../controllers/promotionLineController");
const router = require("express").Router();

router.get("/", promotionLineController.getAll);

router.post("/", promotionLineController.add);
router.patch("/:code", promotionLineController.delete);
router.put("/:code", promotionLineController.update);
module.exports = router;
