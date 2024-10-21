const Location = require("../models/Location");

const locationController = {
  getProvinces: async (req, res) => {
    try {
      // Truy vấn MongoDB để lấy danh sách tỉnh/thành phố và sắp xếp theo tên
      const provinces = await Location.aggregate([
        {
          $group: {
            _id: "$province_id",
            province_name: { $first: "$province_name" },
          },
        },
        {
          $sort: { province_name: 1 }, // Sắp xếp theo tên tỉnh (tăng dần)
        },
      ]);
      res.status(200).json(provinces); // Trả về danh sách tỉnh/thành phố
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" }); // Xử lý lỗi
    }
  },

  getDistrictsByProvince: async (req, res) => {
    const { provinceId } = req.params;
    try {
      const districts = await Location.aggregate([
        { $match: { province_id: provinceId } },
        {
          $group: {
            _id: "$district_id",
            district_name: { $first: "$district_name" },
          },
        },
        {
          $sort: { district_name: 1 }, // Sắp xếp theo tên quận (tăng dần)
        },
      ]);
      res.status(200).json(districts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  getWardsByDistrict: async (req, res) => {
    const { districtId } = req.params;
    try {
      const wards = await Location.aggregate([
        { $match: { district_id: districtId } },
        {
          $group: {
            _id: "$ward_id",
            ward_name: { $first: "$ward_name" },
          },
        },
        {
          $sort: { ward_name: 1 }, // Sắp xếp theo tên phường (tăng dần)
        },
      ]);
      res.status(200).json(wards);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = locationController;
