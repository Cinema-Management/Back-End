const Product = require("../models/Product");

const productController = {
  add: async (req, res) => {
    try {
      const {
        name,
        description,
        image,
        roomCode,
        row,
        column,
        comboItems,
        type,
      } = req.body;

      if (type === 1 || type === 2) {
        const existingMovie = await Product.findOne({ name });
        if (existingMovie) {
          return res
            .status(400)
            .send({ message: "Product name already exists" });
        }
      }

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
          // Kiểm tra code
          if (typeof item.code !== "string" || !item.code) {
            return res
              .status(400)
              .json({ message: "Each item must have a valid code." });
          }

          // Kiểm tra quantity
          if (
            item.quantity !== undefined &&
            (typeof item.quantity !== "number" || item.quantity < 1)
          ) {
            return res
              .status(400)
              .json({ message: "Quantity must be a positive number." });
          }

          // Kiểm tra xem code có tồn tại trong cơ sở dữ liệu hay không
          const product = await Product.findOne({ code: item.code });
          if (!product) {
            return res.status(404).json({
              message: `Product with code ${item.code} does not exist.`,
            });
          }

          // Kiểm tra xem loại sản phẩm có phải là loại 1 không
          if (product.type !== 1) {
            return res.status(400).json({
              message: `Product with code ${item.code} must be of type 1.`,
            });
          }
        }
      }
      const product = new Product({
        code: newCode,
        name,
        description,
        image,

        roomCode,
        row,
        column,

        comboItems,
        type,
      });
      await product.save();
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  getAll: async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};
module.exports = productController;
