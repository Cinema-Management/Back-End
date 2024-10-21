const locationController = require("../controllers/locationController");
const router = require("express").Router();

router.get("/provinces", locationController.getProvinces);

// Route để lấy danh sách quận/huyện theo province_id
router.get("/districts/:provinceId", locationController.getDistrictsByProvince);

// Route để lấy danh sách phường/xã theo district_id
router.get("/wards/:districtId", locationController.getWardsByDistrict);

module.exports = router;
