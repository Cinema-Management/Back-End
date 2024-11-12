const userController = require("../controllers/userController");
const upload = require("../middleware/imageUploadMiddleware");
const router = require("express").Router();

router.post("/signup", userController.signup);

router.post("/signupStaff", userController.signupStaff);
router.post("/login", userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/addStaff", userController.addStaff);
router.post("/addCustomer", userController.addCustomer);

router.post("/checkUserStatusByPhone", userController.checkUserStatusByPhone);
router.post("/checkPhoneOrEmailExist", userController.checkPhoneOrEmailExist);
router.get("/", userController.getAllUser);
router.get("/staff", userController.getAllStaff);
router.get(
  "/getAllStaffPermissionRequest",
  userController.getAllStaffPermissionRequest
);
router.get(
  "/spendingForCurrentYear/:customerCode",
  userController.spendingForCurrentYear
);
router.get(
  "/checkUserForSalesInvoice/:code",
  userController.checkUserForSalesInvoice
);

router.patch("/:code", userController.delete);

router.put(
  "/updatePermissionRequest/:code",
  userController.updatePermissionRequest
);

router.put("/:code", upload.single("image"), userController.update);

module.exports = router;
