const HierarchyValue = require("../models/HierarchyValue");

function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");

  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");

  str = str.replace(/ + /g, " ");
  str = str.trim();

  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
    " "
  );
  return str;
}

const hierarchyValueController = {
  generateCode: async (name, parentCode, level) => {
    const cleanedName = removeVietnameseTones(name);

    // Tách tên ra từng phần
    const nameParts = cleanedName.split(" ");
    let codeBase = nameParts
      .map((part) => {
        // Kiểm tra nếu cụm từ chứa cả số và chữ, thì giữ nguyên cụm
        if (/\d/.test(part) && /[A-Za-z]/.test(part)) {
          return part.toUpperCase(); // Giữ nguyên cả cụm nếu vừa có chữ vừa có số
        }
        // Nếu chỉ có chữ, lấy ký tự đầu tiên viết hoa
        if (/[A-Za-z]/.test(part)) {
          return part.charAt(0).toUpperCase();
        }
        // Nếu chỉ có số, giữ nguyên cụm số
        if (/\d/.test(part)) {
          return part;
        }
      })
      .join("");

    let code = level === 0 ? codeBase : `${parentCode}_${codeBase}`;

    // Kiểm tra xem mã đã tồn tại chưa
    let existing = await HierarchyValue.findOne({ code });
    let counter = 1;

    // Nếu có mã trùng lặp, thêm số vào cuối
    let uniqueCode = code;
    while (existing) {
      uniqueCode = `${code}${counter}`; // Thêm số vào cuối nếu trùng lặp
      existing = await HierarchyValue.findOne({ code: uniqueCode });
      counter++;
    }

    return uniqueCode;
  },

  add: async (req, res) => {
    try {
      const { name, parentCode, level, hierarchyStructureCode } = req.body;

      const existingName = await HierarchyValue.findOne({ name, level });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "Name already exists in this level" });
      }

      const code = await hierarchyValueController.generateCode(
        name.trim(),
        parentCode,
        level
      );
      const hierarchyValue = new HierarchyValue({
        code,
        name,
        parentCode,
        level,
        hierarchyStructureCode,
      });

      await hierarchyValue.save();
      return res.status(201).json(hierarchyValue);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const hierarchyValue = await HierarchyValue.find();
      return res.status(200).send(hierarchyValue);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  getFullAddressByCode: async (req, res) => {
    try {
      const { code } = req.params;

      // Hàm đệ quy lấy địa chỉ đầy đủ từ phân cấp
      const buildFullAddress = async (currentCode, addressParts = []) => {
        const hierarchy = await HierarchyValue.findOne({ code: currentCode });

        if (!hierarchy) {
          return addressParts; // Trả về mảng phần địa chỉ khi không còn mã cha
        }

        // Thêm tên vào phần cuối của mảng addressParts (push)
        addressParts.push(hierarchy.name);

        // Nếu có parentCode, tiếp tục đệ quy
        if (hierarchy.parentCode) {
          return await buildFullAddress(hierarchy.parentCode, addressParts);
        }

        // Nếu không còn parentCode (tức là cấp 0), trả về địa chỉ đầy đủ
        return addressParts;
      };

      // Lấy ra địa chỉ đầy đủ theo cấp phân cấp từ code được truyền vào
      const fullAddressParts = await buildFullAddress(code);

      // Kết hợp các phần của địa chỉ lại thành chuỗi
      const fullAddress = fullAddressParts.join(", ");

      // Trả về địa chỉ đầy đủ
      return res.status(200).json({ fullAddress });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
module.exports = hierarchyValueController;
