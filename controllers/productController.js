const Product = require("../models/Product");
const { update } = require("./movieController");
const uploadImageS3 = require("./upLoadImageS3Controller");
const productController = {
  getAll: async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  getNotSeat: async (req, res) => {
    try {
      const products = await Product.find({ type: { $ne: 0 } });

      const productMap = {};
      const allProducts = await Product.find();
      allProducts.forEach((product) => {
        productMap[product.code] = product.name;
      });

      const result = products.map((product) => {
        const comboItemNames = product.comboItems.map((item) => {
          return {
            code: item.code,
            name: productMap[item.code] || "Không tìm thấy",
            quantity: item.quantity,
          };
        });

        return {
          ...product.toObject(),
          comboItemNames,
        };
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  add: async (req, res) => {
    try {
      const { name, description, type } = req.body;

      const lastProduct = await Product.findOne().sort({
        productId: -1,
      });

      let newCode = "SP01";
      if (lastProduct) {
        const lastCodeNumber = parseInt(lastProduct.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `SP0${nextCodeNumber}` : `SP${nextCodeNumber}`;
      }

      let imageUrl = "";
      if (req.file) {
        imageUrl = await uploadImageS3(req.file); // Gọi hàm upload ảnh
      }
      const product = new Product({
        code: newCode,
        name,
        description,
        image: imageUrl,
        type,
      });
      await product.save();
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  addCombo: async (req, res) => {
    try {
      const { name, description, comboItems, type } = req.body;
      let parsedComboItems = comboItems;
      if (typeof comboItems === "string") {
        try {
          parsedComboItems = JSON.parse(comboItems);
        } catch (err) {
          console.error("JSON parse error:", err);
          return res
            .status(400)
            .json({ message: "Invalid JSON format for comboItems." });
        }
      } else {
        console.log("comboItems is already an array:", parsedComboItems);
      }

      const lastProduct = await Product.findOne().sort({ code: -1 });
      let newCode = "SP01";
      if (lastProduct) {
        const lastCodeNumber = parseInt(lastProduct.code.substring(2));
        const nextCodeNumber = lastCodeNumber + 1;
        newCode =
          nextCodeNumber < 10 ? `SP0${nextCodeNumber}` : `SP${nextCodeNumber}`;
      }
      if (!Array.isArray(parsedComboItems) || parsedComboItems.length === 0) {
        return res
          .status(400)
          .json({ message: "comboItems must be a non-empty array." });
      }

      const codes = parsedComboItems.map((item) => item.code);
      const existingCombo = await Product.find({ code: { $in: codes } });

      if (existingCombo.length !== codes.length) {
        const foundCodes = existingCombo.map((product) => product.code);
        const missingCodes = codes.filter((code) => !foundCodes.includes(code));
        return res.status(404).json({
          message: `Products with codes ${missingCodes.join(
            ", "
          )} do not exist.`,
        });
      }
      for (const item of parsedComboItems) {
        if (
          item.quantity !== undefined &&
          (typeof item.quantity !== "number" || item.quantity < 1)
        ) {
          return res
            .status(400)
            .json({ message: "Quantity must be a positive number." });
        }
      }
      let imageUrl = "";
      if (req.file) {
        imageUrl = await uploadImageS3(req.file);
      }

      const product = new Product({
        code: newCode,
        name,
        description,
        image: imageUrl,
        comboItems: parsedComboItems,
        type,
      });

      await product.save();
      return res.status(201).json(product);
    } catch (error) {
      console.error("Error in addProduct:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  updateCombo: async (req, res) => {
    try {
      const productCode = req.params.code;
      const { name, description, comboItems, type } = req.body;
      const product = await Product.findOne({ code: productCode });
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      let parsedComboItems = comboItems;
      if (typeof comboItems === "string") {
        try {
          parsedComboItems = JSON.parse(comboItems);
        } catch (err) {
          console.error("JSON parse error:", err);
          return res
            .status(400)
            .json({ message: "Invalid JSON format for comboItems." });
        }
      } else {
        console.log("comboItems is already an array:", parsedComboItems);
      }

      if (!Array.isArray(parsedComboItems) || parsedComboItems.length === 0) {
        return res
          .status(400)
          .json({ message: "comboItems must be a non-empty array." });
      }

      const codes = parsedComboItems.map((item) => item.code);
      const existingCombo = await Product.find({ code: { $in: codes } });

      if (existingCombo.length !== codes.length) {
        const foundCodes = existingCombo.map((product) => product.code);
        const missingCodes = codes.filter((code) => !foundCodes.includes(code));
        return res.status(404).json({
          message: `Products with codes ${missingCodes.join(
            ", "
          )} do not exist.`,
        });
      }

      for (const item of parsedComboItems) {
        if (
          item.quantity !== undefined &&
          (typeof item.quantity !== "number" || item.quantity < 1)
        ) {
          return res
            .status(400)
            .json({ message: "Quantity must be a positive number." });
        }
      }
      let imageUrl = "";
      if (req.file) {
        imageUrl = await uploadImageS3(req.file);
      }

      //Khác thì mới update

      if (name && name !== product.name) {
        product.name = name;
      }

      if (description && description !== product.description) {
        product.description = description;
      }

      if (imageUrl) {
        product.image = imageUrl;
      }

      if (Array.isArray(parsedComboItems)) {
        product.comboItems = parsedComboItems;
      }
      if (type && type !== product.type) {
        product.type = type;
      }

      await product.save();
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const productCode = req.params.code;
      const { name, description, roomCode, row, column, comboItems, type } =
        req.body;

      const product = await Product.findOne({ code: productCode });
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      if (type === 0 && (!row || !column)) {
        return res.status(400).json({ message: "Missing row or column" });
      }

      if (type === 2) {
        if (!Array.isArray(comboItems) || comboItems.length === 0) {
          return res
            .status(400)
            .json({ message: "comboItems must be a non-empty array." });
        }

        for (const item of comboItems) {
          if (typeof item.code !== "string" || !item.code) {
            return res
              .status(400)
              .json({ message: "Each item must have a valid code." });
          }

          if (
            item.quantity !== undefined &&
            (typeof item.quantity !== "number" || item.quantity < 1)
          ) {
            return res
              .status(400)
              .json({ message: "Quantity must be a positive number." });
          }

          const product = await Product.findOne({ code: item.code });
          if (!product) {
            return res.status(404).json({
              message: `Product with code ${item.code} does not exist.`,
            });
          }

          if (product.type !== 1) {
            return res.status(400).json({
              message: `Product with code ${item.code} must be of type 1.`,
            });
          }
        }
      }

      let imageUrl = product.image;
      if (req.file) {
        imageUrl = await uploadImageS3(req.file);
      }

      //Khác thì mới update

      if (name && name !== product.name) {
        product.name = name;
      }

      if (description && description !== product.description) {
        product.description = description;
      }

      if (imageUrl) {
        product.image = imageUrl;
      }
      if (roomCode && roomCode !== product.roomCode) {
        product.roomCode = roomCode;
      }
      if (row && row !== product.row) {
        product.row = row;
      }
      if (column && column !== product.column) {
        product.column = column;
      }
      if (comboItems) {
        product.comboItems = comboItems;
      }
      if (type && type !== product.type) {
        product.type = type;
      }
      await product.save();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateStatus: async (req, res) => {
    try {
      const productCode = req.params.code;
      const { status } = req.body;

      const product = await Product.findOne({ code: productCode });
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      product.status = status;
      await product.save();
      return res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteProduct: async (req, res) => {
    try {
      const productCode = req.params.code;
      const product = await Product.findOne({ code: productCode });
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      product.deleted === true;
      await product.save();
      return res.status(200).send({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = productController;
