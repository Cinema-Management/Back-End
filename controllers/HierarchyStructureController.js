const HierarchyStructure = require("../models/HierarchyStructure");

const hierarchyStructureController = {
  add: async (req, res) => {
    try {
      const { name } = req.body;

      // Kiểm tra xem tên cấu trúc phân cấp đã tồn tại chưa
      const existingName = await HierarchyStructure.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "Hierarchy Structure name already exists" });
      }

      // Tìm cấu trúc phân cấp cuối cùng theo hierarchyStructureId
      const lastHierarchyStructure = await HierarchyStructure.findOne().sort({
        hierarchyStructureId: -1,
      });

      let newCode = "PHANCAP01"; // Giá trị mặc định cho mục đầu tiên
      if (lastHierarchyStructure) {
        const lastCodeNumber = parseInt(
          lastHierarchyStructure.code.substring(8)
        );

        // Tăng số thứ tự
        const nextCodeNumber = lastCodeNumber + 1;

        // Tạo mã mới với định dạng
        newCode =
          nextCodeNumber < 10
            ? `PHANCAP0${nextCodeNumber}` // Nếu số nhỏ hơn 10, thêm 0 vào trước
            : `PHANCAP${nextCodeNumber}`; // Nếu số lớn hơn hoặc bằng 10, giữ nguyên
      }

      // Tạo cấu trúc phân cấp mới
      const hierarchyStructure = new HierarchyStructure({
        code: newCode,
        name,
      });
      await hierarchyStructure.save();

      return res.status(201).send(hierarchyStructure);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  getAll: async (req, res) => {
    try {
      const hierarchyStructure = await HierarchyStructure.find();
      return res.status(200).send(hierarchyStructure);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};

module.exports = hierarchyStructureController;
