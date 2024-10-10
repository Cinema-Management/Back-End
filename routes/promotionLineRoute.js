const promotionLineController = require("../controllers/promotionLineController");
const router = require("express").Router();

router.get("/", promotionLineController.getAll);
router.get("/getPromotionDetailsByDateAndStatus", promotionLineController.getPromotionDetailsByDateAndStatus);


router.post("/", promotionLineController.add);
router.delete("/:code", promotionLineController.delete);
router.put("/updateStatus", promotionLineController.updateStatus);
module.exports = router;
