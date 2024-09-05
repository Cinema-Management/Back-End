const User = require("../models/User");
const bcrypt = require("bcrypt");

const userController = {
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
        return res.status(200).json(user);
      }
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
      res.status(500).json({ error: "Server login error" });
    }
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

module.exports = userController;
