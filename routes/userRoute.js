const userController = require("../controllers/userController");
const router = require("express").Router();

router.post("/signup", userController.signup);

router.post("/signupStaff", userController.signupStaff);
router.post("/login", userController.login);
router.get("/", userController.getAllUser);
router.get("/staff", userController.getAllStaff);

module.exports = router;
