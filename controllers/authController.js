const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let refreshTokens = [];

const authController = {
  signup: async (req, res) => {
    try {
      const {
        code,
        name,
        birthDate,
        gender,
        address,
        avatar,
        phone,
        email,
        password,
        type,
        isAdmin,
        status,
      } = req.body;

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
      const accessToken = authController.generateAccessToken(user);
      const refreshToken = authController.generateRefreshToken(user);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });

      return res.status(200).json({ user, accessToken, refreshToken });
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      res.status(500).json({ error: "Server signup error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, phone, password } = req.body;
      let user;

      if (email) {
        user = await User.findOne({ email: email });
      } else {
        user = await User.findOne({ phone: phone });
      }
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Wrong password" });
      }
      if (user && isMatch) {
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

        return res
          .status(200)
          .json({ user: others, accessToken, refreshToken });
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
      { expiresIn: "20s" }
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
    //Take refresh token from user
    console.log("Cookies:", req.cookies);
    const refreshToken = req.cookies.refreshToken;
    //Send error if token is not valid
    if (!refreshToken) return res.status(401).json("You're not authenticated");
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json("Refresh token is not valid");
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
      //create new access token, refresh token and send to user
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
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
};
module.exports = authController;
