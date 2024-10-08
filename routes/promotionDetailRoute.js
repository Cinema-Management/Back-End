const promotionDetailController = require("../controllers/promotionDetailController");
const router = require("express").Router();

router.get("/", promotionDetailController.getAll);
router.get(
  "/getAllByPromotionLineCode/:code",
  promotionDetailController.getAllByPromotionLineCode
);

router.post("/", promotionDetailController.add);
router.put("/:code", promotionDetailController.update);

router.delete("/:code", promotionDetailController.delete);

module.exports = router;
