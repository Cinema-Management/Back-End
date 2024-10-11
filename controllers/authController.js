const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let refreshTokens = [];

const authController = {
  register: async (req, res) => {
    try {
      const { name, birthDate, gender, phone, email, password, type } =
        req.body;

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);

      const existingUser = await User.findOne({
        $or: [
          { phone: phone, type: type },
          { email: email, type: type },
        ],
      });

      if (existingUser) {
        return res.status(400).send({
          error: "A user with the same type, phone, or email already exists.",
        });
      }

      let prefix;
      if (type === 0) {
        prefix = "KH"; // Mã nhân viên
      } else if (type === 1) {
        prefix = "NV"; // Mã khách hàng
      } else {
        return res.status(400).send({ message: "Invalid user type." });
      }

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
        avatar:
          "https://i.pinimg.com/564x/7b/8f/3a/7b8f3a829162b7656214494b0b87e4e0.jpg",
        password: hashPassword,
        phone: phone,
        email: email,
        isAdmin: null,
        status: 1,
        type: type,
      });

      // Lưu user vào cơ sở dữ liệu
      await user.save();

      if (user) {
        const accessToken = authController.generateAccessToken(user);
        //Generate refresh token
        const refreshToken = authController.generateRefreshToken(user);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });

        //Hidden password
        const { password, ...others } = user._doc;

        if (type === 0) {
          return res.status(200).json({ ...others, accessToken, refreshToken });
        } else {
          return res.status(200).json({ ...others, accessToken }); // Không bao gồm refreshToken khi type khác 0
        }
      }
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      res.status(500).json({ error: "Server signup error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, phone, password, type } = req.body;
      let user;

      if (email) {
        user = await User.findOne({ email: email });
      } else if (phone) {
        user = await User.findOne({ phone: phone });
      } else {
        return res
          .status(400)
          .send({ message: "Please provide either email or phone." });
      }
      if (user.type !== type) {
        return res.status(401).json({ error: "User not found" });
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Wrong password" });
      }
      if (user && isMatch) {
        const accessToken = authController.generateAccessToken(user);

        const refreshToken = authController.generateRefreshToken(user);

        //Generate refresh token

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });

        //Hidden password
        const { password, ...others } = user._doc;

        if (type === 0) {
          return res.status(200).json({ ...others, accessToken, refreshToken });
        } else {
          return res.status(200).json({ ...others, accessToken }); // Không bao gồm refreshToken khi type khác 0
        }
      }
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
      res.status(500).json({ error: "Server login error" });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      {
        id: user.code,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "100d" }
    );
  },
  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user.code,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "365d" }
    );
  },

  requestRefreshToken: async (req, res) => {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json("You're not authenticated");

    // Kiểm tra token trong danh sách
    if (refreshTokens.includes(refreshToken)) {
      return res.status(403).json("Refresh token is not valid");
    }

    // Xác thực refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
      if (err) {
        return res.status(403).json("Token verification failed");
      }

      // Loại bỏ refresh token cũ và tạo refresh token mới
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      // Thêm refresh token mới vào danh sách
      refreshTokens.push(newRefreshToken);

      // Lưu lại refresh token mới vào cookie
      res.cookie("refreshToken", newRefreshToken, {
        // Cập nhật refresh token mới
        httpOnly: true,
        secure: false, // Đặt thành true nếu dùng HTTPS
        path: "/",
        sameSite: "strict",
      });

      // Trả về access token mới
      return res.status(200).json({
        accessToken: newAccessToken,
      });
    });
  },

  getAllUser: async (req, res) => {
    try {
      const user = await User.find({ type: "0" });
      return res.status(200).send(user);
    } catch (error) {
      res.status(500).json({ error: "Server getUser error" });
    }
  },

  logOut: async (req, res) => {
    //Clear cookies when user logs out
    res.clearCookie("refreshToken");
    res.status(200).json("Logged out successfully!");
  },
};
module.exports = authController;
