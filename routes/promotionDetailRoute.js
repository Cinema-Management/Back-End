const promotionDetailController = require("../controllers/promotionDetailController");
const router = require("express").Router();

router.get("/", promotionDetailController.getAll);
router.get(
  "/getAllByPromotionLineCode/:code",
  promotionDetailController.getAllByPromotionLineCode
);
router.get(
  "/getPromotionDetailsByDateAndStatus",
  promotionDetailController.getPromotionDetailsByDateAndStatus
);
router.get(
  "/checkPromotionInPromotionResult/:promotionLineCode",
  promotionDetailController.checkPromotionDetailInPromotionResult
);

router.post("/", promotionDetailController.add);
router.put("/:code", promotionDetailController.update);

router.patch("/:code", promotionDetailController.delete);

module.exports = router;
