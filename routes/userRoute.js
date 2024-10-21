const userController = require("../controllers/userController");
const router = require("express").Router();

router.post("/signup", userController.signup);

router.post("/signupStaff", userController.signupStaff);
router.post("/login", userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/addStaff", userController.addStaff);
router.post("/checkUserStatusByPhone", userController.checkUserStatusByPhone);

router.get("/", userController.getAllUser);
router.get("/staff", userController.getAllStaff);

router.put("/:code", userController.update);
router.patch("/:code", userController.delete);

module.exports = router;
