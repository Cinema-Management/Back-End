const promotionController = require("../controllers/promotionController");
const router = require("express").Router();

router.get("/", promotionController.getAll);
router.get(
  "/getPromotionsWithLines",
  promotionController.getPromotionsWithLines
);

router.post("/", promotionController.add);

module.exports = router;
