const authController = require("../controllers/authController");
const router = require("express").Router();
const middleware = require("../middleware/middlewareController");
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.requestRefreshToken);
router.post("/refreshApp", authController.requestRefreshTokenApp);
router.post("/logout", middleware.verifyToken, authController.logOut);
router.get("/", authController.getAllUser);
// router.get("/", userController.getAllUser);

module.exports = router;
