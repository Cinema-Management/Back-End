const HierarchyValue = require("../models/HierarchyValue");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const uploadImageS3 = require("./upLoadImageS3Controller");
const SalesInvoice = require("../models/SalesInvoice");
const SalesInvoiceDetail = require("../models/SalesInvoiceDetail");
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
const userController = {
  signup: async (req, res) => {
    try {
      const { name, birthDate, gender, address, phone, email, password } =
        req.body;

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      if (email) {
        const existingUserEmail = await User.findOne({ email: email });
        if (existingUserEmail) {
          return res.status(400).send({ error: "Email already exists" });
        }
      } else {
        const existingUserPhone = await User.findOne({ phone: phone });

        if (existingUserPhone) {
          return res.status(400).send({ error: "Phone already exists" });
        }
      }

      const prefix = "KH";
      const lastUser = await User.findOne({
        code: { $regex: `${prefix}` },
      }).sort({ code: -1 });

      let newCode = `${prefix}01`;

      if (lastUser) {
        const lastCodeNumber = parseInt(lastUser.code.substring(2));
        newCode = `${prefix}${String(lastCodeNumber + 1).padStart(2, "0")}`;
      }
      const user = new User({
        code: newCode,
        name: name,
        birthDate: birthDate,
        gender: gender,
        address: address,
        password: hashPassword,
        avatar:
          "https://i.pinimg.com/564x/7b/8f/3a/7b8f3a829162b7656214494b0b87e4e0.jpg",
        phone: phone || null,
        email: email || null,
        isAdmin: null,
        type: 0,
        status: 1,
      });

      // Lưu user vào cơ sở dữ liệu
      await user.save();
      return res.status(201).send(user);
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      res.status(500).json({ error: "Server signup error" });
    }
  },

  signupStaff: async (req, res) => {
    try {
      const { name, birthDate, gender, address, phone, email, password } =
        req.body;

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      if (email) {
        const existingUserEmail = await User.findOne({ email: email });
        if (existingUserEmail) {
          return res.status(400).send({ error: "Email already exists" });
        }
      } else {
        const existingUserPhone = await User.findOne({ phone: phone });

        if (existingUserPhone) {
          return res.status(400).send({ error: "Phone already exists" });
        }
      }

      const prefix = "NV";
      const lastUser = await User.findOne({
        code: { $regex: `${prefix}` },
      }).sort({ code: -1 });

      let newCode = `${prefix}01`;

      if (lastUser) {
        const lastCodeNumber = parseInt(lastUser.code.substring(2));
        newCode = `${prefix}${String(lastCodeNumber + 1).padStart(2, "0")}`;
      }
      const user = new User({
        code: newCode,
        name: name,
        birthDate: birthDate,
        gender: gender,
        address: address,
        password: hashPassword,
        avatar:
          "https://i.pinimg.com/564x/7b/8f/3a/7b8f3a829162b7656214494b0b87e4e0.jpg",
        phone: phone || null,
        email: email || null,
        isAdmin: null,
        type: 1,
        status: 1,
      });

      // Lưu user vào cơ sở dữ liệu
      await user.save();
      return res.status(201).send(user);
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      res.status(500).json({ error: "Server signup error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, phone, password } = req.body;
      let user;

      if (phone) {
        user = await User.findOne({ phone: phone });
      } else {
        user = await User.findOne({ email: email });
      }
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Wrong password" });
      }
      if (user && isMatch) {
        return res.status(200).json(user);
      }
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
      res.status(500).json({ error: "Server login error" });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { password, passwordNew, code } = req.body;
      console.log("123", password);
      const user = await User.findOne({ code: code });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Wrong password" });
      }
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(passwordNew, salt);
      user.password = hashPassword;
      await user.save();
      return res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Server forgotPassword error" });
    }
  },

  getAllUser: async (req, res) => {
    try {
      const users = await User.find({ type: 0 });

      const userWithAddresses = await Promise.all(
        users.map(async (user) => {
          try {
            // Giả định rằng hàm buildFullAddress nhận mã địa chỉ
            const fullAddress = await buildFullAddress(user.address);

            // Tính số lượng phòng cho rạp này

            return {
              ...user.toObject(),
              fullAddress, // Thêm địa chỉ đầy đủ vào kết quả
            };
          } catch (err) {
            console.error("Error in constructing address for user:", user, err);
            return {
              ...user.toObject(),
              fullAddress: "Address not found", // Trả về thông báo lỗi nếu có
            };
          }
        })
      );
      return res.status(200).send(userWithAddresses);
    } catch (error) {
      res.status(500).json({ error: "Server getUser error" });
    }
  },
  getAllStaff: async (req, res) => {
    try {
      const users = await User.find({ type: 1 });

      const userWithAddresses = await Promise.all(
        users.map(async (user) => {
          try {
            // Giả định rằng hàm buildFullAddress nhận mã địa chỉ
            const fullAddress = await buildFullAddress(user.address);

            // Tính số lượng phòng cho rạp này

            return {
              ...user.toObject(),
              fullAddress, // Thêm địa chỉ đầy đủ vào kết quả
            };
          } catch (err) {
            console.error("Error in constructing address for user:", user, err);
            return {
              ...user.toObject(),
              fullAddress: "Address not found", // Trả về thông báo lỗi nếu có
            };
          }
        })
      );
      return res.status(200).send(userWithAddresses);
    } catch (error) {
      res.status(500).json({ error: "Server getUser error" });
    }
  },

  addStaff: async (req, res) => {
    try {
      const { name, birthDate, gender, phone, email, address, cinemaCode } =
        req.body;

      const salt = bcrypt.genSaltSync(10);

      const hashPassword = bcrypt.hashSync("1111", salt);

      const existingUser = await User.findOne({
        $or: [
          { phone: phone, type: 1 },
          { email: email, type: 1 },
        ],
      });

      if (existingUser) {
        return res.status(400).send({
          error: "A user with the same type, phone, or email already exists.",
        });
      }

      let prefix = "NV";

      // Lấy tất cả tài liệu người dùng đã tồn tại
      const allUsers = await User.findWithDeleted();

      // Tạo mã mới
      let newCode = `${prefix}01`; // Bắt đầu với 01
      let existingCodes = new Set();

      // Thu thập các mã đã tồn tại
      allUsers.forEach((user) => {
        if (user.code.startsWith(prefix)) {
          existingCodes.add(user.code);
        }
      });

      // Tăng số thứ tự nếu mã đã tồn tại
      let lastCodeNumber = 1;
      while (existingCodes.has(newCode)) {
        lastCodeNumber++;
        newCode = `${prefix}${String(lastCodeNumber).padStart(2, "0")}`; // Đảm bảo có 2 chữ số
      }

      const user = new User({
        code: newCode,
        name: name,
        birthDate: birthDate,
        gender: gender,
        address,
        avatar:
          "https://i.pinimg.com/564x/7b/8f/3a/7b8f3a829162b7656214494b0b87e4e0.jpg",
        password: hashPassword,
        phone: phone,
        email: email,
        isAdmin: false,
        status: 0,
        type: 1,
        cinemaCode,
      });

      // Lưu user vào cơ sở dữ liệu
      await user.save();

      //Hidden password
      const { password, ...others } = user._doc;

      return res.status(200).json({ ...others });
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      res.status(500).json({ error: "Server signup error" });
    }
  },
  addCustomer: async (req, res) => {
    try {
      const { name, birthDate, gender, phone, email, address } = req.body;

      const salt = bcrypt.genSaltSync(10);

      const hashPassword = bcrypt.hashSync("1111", salt);

      const existingUser = await User.findOne({
        $or: [
          { phone: phone, type: 0 },
          { email: email, type: 0 },
        ],
      });

      if (existingUser) {
        return res.status(400).send({
          error: "A user with the same type, phone, or email already exists.",
        });
      }

      let prefix = "KH";

      // Lấy tất cả tài liệu người dùng đã tồn tại
      const allUsers = await User.findWithDeleted();

      // Tạo mã mới
      let newCode = `${prefix}01`; // Bắt đầu với 01
      let existingCodes = new Set();

      // Thu thập các mã đã tồn tại
      allUsers.forEach((user) => {
        if (user.code.startsWith(prefix)) {
          existingCodes.add(user.code);
        }
      });

      // Tăng số thứ tự nếu mã đã tồn tại
      let lastCodeNumber = 1;
      while (existingCodes.has(newCode)) {
        lastCodeNumber++;
        newCode = `${prefix}${String(lastCodeNumber).padStart(2, "0")}`; // Đảm bảo có 2 chữ số
      }

      const user = new User({
        code: newCode,
        name: name,
        birthDate: birthDate,
        gender: gender,
        address,
        avatar:
          "https://i.pinimg.com/564x/7b/8f/3a/7b8f3a829162b7656214494b0b87e4e0.jpg",
        password: hashPassword,
        phone: phone,
        email: email,
        status: 0,
        type: 0,
      });

      // Lưu user vào cơ sở dữ liệu
      await user.save();

      //Hidden password
      const { password, ...others } = user._doc;

      return res.status(200).json({ ...others });
    } catch (error) {
      res.status(500).json({ error: "Add error" });
    }
  },
  checkUserStatusByPhone: async (req, res) => {
    try {
      const { phone, type } = req.body;

      // Tìm user dựa trên số điện thoại
      const user = await User.findOne({ phone: phone, type: type });

      // Kiểm tra nếu user không tồn tại
      if (!user) {
        return res.status(200).json();
      }

      // Kiểm tra trạng thái của tài khoản
      if (user.status === 2) {
        return res.status(200).json(user.status);
      }

      return res.status(200).json(user.status);
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái người dùng:", error);
      return res
        .status(500)
        .json({ error: "Lỗi server khi kiểm tra trạng thái người dùng." });
    }
  },

  update: async (req, res) => {
    try {
      const { code } = req.params; // Lấy mã nhân viên từ params
      const {
        name,
        birthDate,
        gender,
        phone,
        email,
        address,
        cinemaCode,
        status,
        isAdmin,
      } = req.body;
      let imageUrl = "";
      // Tìm nhân viên theo mã code
      const existingUser = await User.findOne({ code: code });
      if (req.file) {
        imageUrl = await uploadImageS3(req.file); // Gọi hàm upload ảnh
        // Cập nhật avatar nếu URL mới khác URL hiện tại
        if (imageUrl !== existingUser.avatar) {
          existingUser.avatar = imageUrl;
        }
      }

      // Kiểm tra nếu nhân viên không tồn tại
      if (!existingUser) {
        return res.status(404).json({ error: "Staff member not found." });
      }

      // Chỉ cập nhật nếu giá trị mới khác giá trị hiện tại
      if (name && name !== existingUser.name) {
        existingUser.name = name;
      }
      if (
        birthDate &&
        birthDate !== existingUser.birthDate &&
        birthDate !== "" &&
        birthDate !== null
      ) {
        existingUser.birthDate = birthDate;
      }
      if (gender && gender !== existingUser.gender) {
        existingUser.gender = gender;
      }
      if (phone && phone !== existingUser.phone) {
        existingUser.phone = phone;
      }
      if (email && email !== existingUser.email) {
        existingUser.email = email;
      }
      if (address && address !== existingUser.address) {
        existingUser.address = address;
      }
      if (cinemaCode && cinemaCode !== existingUser.cinemaCode) {
        existingUser.cinemaCode = cinemaCode;
      }

      if (isAdmin !== undefined && isAdmin !== existingUser.isAdmin) {
        existingUser.isAdmin = isAdmin; // Cập nhật với giá trị mới
      }

      if (status !== undefined && status !== existingUser.status) {
        existingUser.status = status;
      }

      // Lưu lại thông tin cập nhật nếu có thay đổi
      await existingUser.save();

      // Ẩn mật khẩu trước khi trả về phản hồi
      const { password, ...updatedUser } = existingUser._doc;

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Failed to update staff:", error);
      res.status(500).json({ error: "Server error while updating staff" });
    }
  },
  delete: async (req, res) => {
    try {
      const { code } = req.params; // Lấy code của cinema từ URL

      // Tìm kiếm cinema theo code
      const user = await User.findOne({ code: code });

      // Kiểm tra nếu User không tồn tại
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Kiểm tra trạng thái status, chỉ cho phép xóa khi status = 0
      if (user.status !== 0) {
        return res
          .status(400)
          .json({ message: "Active User cannot be deleted" });
      }

      // Xóa mềm User (soft delete) bằng mongoose-delete dựa trên code
      const deletedUser = await User.delete({ code: code });

      return res.status(200).json({
        message: "User deleted successfully",
        data: deletedUser,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting User", error });
    }
  },
  updatePermissionRequest: async (req, res) => {
    try {
      const { code } = req.params; // Lấy mã người dùng từ params
      const { status } = req.body; // Lấy status từ body

      // Kiểm tra xem status có hợp lệ hay không
      if (typeof status !== "number") {
        return res.status(400).json({ error: "Status must be a number." });
      }

      // Tìm người dùng theo mã
      const existingUser = await User.findOne({ code: code });

      // Kiểm tra nếu người dùng không tồn tại
      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Kiểm tra xem permissionRequest đã tồn tại hay chưa
      if (!existingUser.permissionRequest) {
        // Nếu chưa có, tạo mới với giá trị mặc định
        existingUser.permissionRequest = {
          status: 0, // Giá trị mặc định
          date: null, // Giá trị mặc định
        };
      }

      // Cập nhật permissionRequest
      existingUser.permissionRequest.status = status; // Đặt trạng thái từ request
      existingUser.permissionRequest.date = new Date(); // Đặt thời gian hiện tại

      // Lưu lại thông tin cập nhật
      await existingUser.save();

      return res.status(200).json({
        message: "Permission request updated successfully.",
        user: existingUser,
      });
    } catch (error) {
      console.error("Failed to update permission request:", error);
      res
        .status(500)
        .json({ error: "Server error while updating permission request" });
    }
  },
  getAllStaffPermissionRequest: async (req, res) => {
    try {
      const users = await User.find({ "permissionRequest.status": 1 });

      const userWithAddresses = await Promise.all(
        users.map(async (user) => {
          try {
            // Giả định rằng hàm buildFullAddress nhận mã địa chỉ
            const fullAddress = await buildFullAddress(user.address);

            // Tính số lượng phòng cho rạp này

            return {
              ...user.toObject(),
              fullAddress, // Thêm địa chỉ đầy đủ vào kết quả
            };
          } catch (err) {
            console.error("Error in constructing address for user:", user, err);
            return {
              ...user.toObject(),
              fullAddress: "Address not found", // Trả về thông báo lỗi nếu có
            };
          }
        })
      );
      return res.status(200).send(userWithAddresses);
    } catch (error) {
      res.status(500).json({
        error: "Server error while getting staff with permission request",
      });
    }
  },
  checkPhoneOrEmailExist: async (req, res) => {
    try {
      const { phone, email, type } = req.body;

      const existingUser = await User.findOne({
        type: type,
        $or: [{ phone: phone }, { email: email }],
      });

      if (existingUser) {
        if (existingUser.phone === phone) {
          return res.status(200).send({ phone: true });
        } else if (existingUser.email === email) {
          return res.status(200).send({ email: true });
        }
      }

      // Nếu không tìm thấy tài khoản với cả phone và email
      return res.status(200).send({ phone: false, email: false });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Server error while checking phone or email exist" });
    }
  },
  spendingForCurrentYear: async (req, res) => {
    try {
      const { customerCode } = req.params;

      // Tìm thông tin khách hàng (nếu cần thiết)
      const customer = await User.findOne({ code: customerCode });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const currentYear = new Date().getFullYear();

      const result = await SalesInvoice.aggregate([
        {
          $match: {
            customerCode: customerCode,
            status: 1,
            createdAt: {
              $gte: new Date(`${currentYear}-01-01T00:00:00Z`),
              $lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`),
            },
          },
        },
        {
          $lookup: {
            from: "sales_invoice_details",
            localField: "code",
            foreignField: "salesInvoiceCode",
            as: "invoiceDetails",
          },
        },
        {
          $unwind: "$invoiceDetails",
        },
        {
          $group: {
            _id: "$code",
            totalDetailsAmount: { $sum: "$invoiceDetails.totalAmount" }, // Tổng tất cả chi tiết hóa đơn cho từng hóa đơn
          },
        },
        {
          $lookup: {
            from: "promotion_results",
            localField: "_id", // Mã hóa đơn
            foreignField: "salesInvoiceCode",
            as: "promotionResults",
          },
        },
        {
          $unwind: {
            path: "$promotionResults",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            totalDetailsAmount: 1,
            discountAmount: {
              $ifNull: ["$promotionResults.discountAmount", 0], // Giảm giá nếu có, nếu không mặc định là 0
            },
          },
        },
        {
          $project: {
            adjustedAmount: {
              $subtract: ["$totalDetailsAmount", "$discountAmount"],
            }, // Tổng chi tiết hóa đơn sau khi trừ giảm giá
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$adjustedAmount" }, // Tổng tất cả các hóa đơn sau khi đã trừ giảm giá
          },
        },
      ]);

      if (result.length === 0) {
        return res.status(200).json({ totalAmount: 0 });
      }

      return res.status(200).json({ totalAmount: result[0].totalAmount });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Server error while calculating total amount" });
    }
  },

  checkUserForSalesInvoice: async (req, res) => {
    try {
      const { code } = req.params; // Lấy mã khách hàng từ params

      // Tìm thông tin khách hàng
      const customer = await User.findOne({
        code: code,
      });
      if (!customer) {
        return res.status(404).json({ error: "User not found" });
      }
      const salesInvoice = await SalesInvoice.findOne({
        $or: [{ customerCode: code }, { staffCode: code }],
      });
      if (!salesInvoice) {
        return res.status(200).send(false);
      } else {
        return res.status(200).json(true);
      }
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Server error while checking user" });
    }
  },
};

module.exports = userController;
