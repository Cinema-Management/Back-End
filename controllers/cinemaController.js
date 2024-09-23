const Cinema = require("../models/Cinema");
const HierarchyValue = require("../models/HierarchyValue");

const buildFullAddress = async (currentCode) => {
  const addressParts = [];

  const build = async (code) => {
    const hierarchy = await HierarchyValue.findOne({ code });
    if (!hierarchy) return;

    // Thêm tên vào phần cuối của mảng addressParts trước khi đệ quy
    addressParts.push(hierarchy.name);

    // Nếu có parentCode, tiếp tục đệ quy
    if (hierarchy.parentCode) {
      await build(hierarchy.parentCode);
    }
  };

  await build(currentCode);
  return addressParts.join(", "); // Không đảo thứ tự
};

const cinemaController = {
  add: async (req, res) => {
    try {
      const { name, hierarchyValueCode } = req.body;

      const existingCinema = await Cinema.findOne({ name });
      if (existingCinema) {
        return res.status(400).send({ message: "Cinema name already exists" });
      }
      const existingLocation = await HierarchyValue.findOne({
        code: hierarchyValueCode,
      });
      if (existingLocation) {
        return res.status(400).send({ message: "Address code already exists" });
      }

      const lastCinema = await Cinema.findOne().sort({
        cinemaId: -1,
      });

      let newCode = "RAP01";
      if (lastCinema) {
        const lastCodeNumber = parseInt(lastCinema.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `RAP0${nextCodeNumber}`
            : `RAP${nextCodeNumber}`;
      }

      const cinema = new Cinema({
        code: newCode,
        name,
        hierarchyValueCode,
      });

      await cinema.save();
      return res.status(201).send(cinema);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const cinema = await Cinema.find();
      return res.status(200).send(cinema);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  getAllFullAddress: async (req, res) => {
    try {
      const cinemas = await Cinema.find();
      console.log("Cinemas found:", cinemas);

      if (cinemas.length === 0) {
        return res.status(404).send({ message: "No Cinema found." });
      }

      const cinemasWithAddresses = await Promise.all(
        cinemas.map(async (cinema) => {
          try {
            const fullAddress = await buildFullAddress(
              cinema.hierarchyValueCode
            );
            return {
              ...cinema.toObject(),
              fullAddress,
            };
          } catch (err) {
            console.error(
              "Error in constructing address for Cinema:",
              cinema,
              err
            );
            return {
              ...cinema.toObject(),
              fullAddress: "Address not found",
            };
          }
        })
      );

      return res.status(200).send(cinemasWithAddresses);
    } catch (error) {
      console.error("Lỗi trong getAllFullAddress:", error);
      return res.status(500).send({ message: "Lỗi máy chủ nội bộ" });
    }
  },

  update: async (req, res) => {
    try {
      const code = req.params.code;
      const { name, hierarchyValueCode, status } = req.body;

      // Tìm rạp chiếu với code tương ứng
      const cinema = await Cinema.findOne({ code });
      if (!cinema) {
        return res.status(404).send({ message: "Not found" });
      }

      // Kiểm tra nếu hierarchyValueCode có tồn tại trong HierarchyValue
      if (hierarchyValueCode) {
        const hierarchyExists = await HierarchyValue.findOne({
          code: hierarchyValueCode,
        });
        if (!hierarchyExists) {
          return res
            .status(400)
            .send({ message: "Address code already exists" });
        }
        cinema.hierarchyValueCode = hierarchyValueCode;
      }

      // Cập nhật các trường khác nếu có
      if (name) {
        cinema.name = name;
      }
      if (status !== undefined) {
        cinema.status = status; // Kiểm tra status có thể là 0 hoặc 1
      }

      await cinema.save();
      return res.status(200).send(cinema);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  },
};

module.exports = cinemaController;
