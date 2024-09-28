const cinemaController = require("../controllers/cinemaController");

const router = require("express").Router();

router.post("/", cinemaController.add);
router.get("/", cinemaController.getAll);
router.get("/getAllFullAddress", cinemaController.getAllFullAddress);
router.put("/", cinemaController.update);
router.patch("/restore/:code", cinemaController.restore);
router.delete("/:code", cinemaController.delete);
module.exports = router;
