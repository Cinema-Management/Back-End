const hierarchyValueController = require("../controllers/HierarchyValueController");

const router = require("express").Router();

router.post("/", hierarchyValueController.add);
router.get("/", hierarchyValueController.getAll);
router.get("/:code", hierarchyValueController.getAllByCode);
// router.put("/:code", hierarchyValueController.update);

module.exports = router;
