const hierarchyStructureController = require("../controllers/hierarchyStructureController");

const router = require("express").Router();

router.post("/", hierarchyStructureController.add);
router.get("/", hierarchyStructureController.getAll);

module.exports = router;
