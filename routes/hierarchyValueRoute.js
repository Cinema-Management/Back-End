const hierarchyValueController = require("../controllers/hierarchyValueController");

const router = require("express").Router();

router.post("/", hierarchyValueController.add);
router.get("/", hierarchyValueController.getAll);
router.get("/:code", hierarchyValueController.getFullAddressByCode);
// router.put("/:code", hierarchyValueController.update);

module.exports = router;
