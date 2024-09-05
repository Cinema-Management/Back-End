const authController = require("../controllers/authController");
const router = require("express").Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.requestRefreshToken);
router.get("/", authController.getAllUser);
// router.get("/", userController.getAllUser);

module.exports = router;
