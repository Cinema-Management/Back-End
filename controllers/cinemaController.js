const Cinema = require("../models/Cinema");
const HierarchyValue = require("../models/HierarchyValue");
const Room = require("../models/Room");

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

      const existingCinema = await Cinema.findOne({ hierarchyValueCode });
      if (existingCinema) {
        return res.status(400).send({ message: "Address  already exists" });
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
      // Tìm tất cả các rạp chiếu phim
      const cinemas = await Cinema.find();

      // Kiểm tra nếu không tìm thấy rạp nào
      if (cinemas.length === 0) {
        return res.status(404).send({ message: "No Cinema found." });
      }

      // Xử lý để xây dựng địa chỉ đầy đủ và số lượng phòng cho mỗi rạp
      const cinemasWithAddresses = await Promise.all(
        cinemas.map(async (cinema) => {
          try {
            // Giả định rằng hàm buildFullAddress nhận mã địa chỉ
            const fullAddress = await buildFullAddress(
              cinema.hierarchyValueCode
            );

            // Tính số lượng phòng cho rạp này
            const roomsCount = await Room.countDocuments({
              cinemaCode: cinema.code,
            });

            return {
              ...cinema.toObject(),
              fullAddress, // Thêm địa chỉ đầy đủ vào kết quả
              roomsCount, // Thêm số lượng phòng vào kết quả
            };
          } catch (err) {
            console.error(
              "Error in constructing address for Cinema:",
              cinema,
              err
            );
            return {
              ...cinema.toObject(),
              fullAddress: "Address not found", // Trả về thông báo lỗi nếu có
              roomsCount: 0, // Nếu có lỗi, có thể trả về 0 phòng
            };
          }
        })
      );

      // Trả về danh sách các rạp cùng địa chỉ đầy đủ và số lượng phòng
      return res.status(200).send(cinemasWithAddresses);
    } catch (error) {
      console.error("Lỗi trong getAllFullAddress:", error);
      return res.status(500).send({ message: "Lỗi máy chủ nội bộ" });
    }
  },
  update: async (req, res) => {
    try {
      const { code, name, hierarchyValueCode, status } = req.body;

      // Tìm rạp dựa trên mã code
      const existingCinema = await Cinema.findOne({ code });
      if (!existingCinema) {
        return res.status(404).send({ message: "Cinema not found" });
      }

      // Nếu giá trị hierarchyValueCode mới khác với giá trị cũ, kiểm tra xem địa chỉ đó đã tồn tại chưa
      if (
        hierarchyValueCode &&
        hierarchyValueCode !== existingCinema.hierarchyValueCode
      ) {
        const existingCinemaAddress = await Cinema.findOne({
          hierarchyValueCode,
        });
        if (existingCinemaAddress) {
          return res.status(400).send({ message: "Address already exists" });
        }
      }

      // Cập nhật tên nếu có
      if (name) {
        existingCinema.name = name;
      }

      // Cập nhật hierarchyValueCode nếu có
      if (hierarchyValueCode) {
        existingCinema.hierarchyValueCode = hierarchyValueCode;
      }

      if (
        status !== undefined &&
        status !== existingCinema.status &&
        status !== null &&
        status !== ""
      ) {
        existingCinema.status = status;
      }

      // Lưu thay đổi vào cơ sở dữ liệu
      await existingCinema.save();

      return res.status(200).send(existingCinema);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { code } = req.params; // Lấy code của cinema từ URL

      // Tìm kiếm cinema theo code
      const cinema = await Cinema.findOne({ code: code });

      // Kiểm tra nếu cinema không tồn tại
      if (!cinema) {
        return res.status(404).json({ message: "Cinema not found" });
      }

      // Kiểm tra trạng thái status, chỉ cho phép xóa khi status = 0
      if (cinema.status !== 0) {
        return res
          .status(400)
          .json({ message: "Active cinema cannot be deleted" });
      }

      // Xóa mềm cinema (soft delete) bằng mongoose-delete dựa trên code
      const deletedCinema = await Cinema.delete({ code: code });

      return res.status(200).json({
        message: "Cinema deleted successfully",
        data: deletedCinema,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting cinema", error });
    }
  },

  restore: async (req, res) => {
    try {
      const { code } = req.params; // Lấy code của cinema từ URL

      // Khôi phục cinema đã xóa
      const restoredCinema = await Cinema.restore({ code: code });

      if (!restoredCinema) {
        return res
          .status(404)
          .json({ message: "Cinema not found or not deleted" });
      }

      return res.status(200).json({
        message: "Cinema restored successfully",
        data: restoredCinema,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error restoring cinema", error });
    }
  },
};

module.exports = cinemaController;
