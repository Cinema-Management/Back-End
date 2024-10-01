const ProductType = require("../models/ProductType");

const roomTypeController = {
  add: async (req, res) => {
    try {
      const { name, description } = req.body;

      const existingName = await ProductType.findOne({ name });
      if (existingName) {
        return res
          .status(400)
          .send({ message: "ProductType name already exists" });
      }

      const lastProductType = await ProductType.findOne().sort({
        productTypeId: -1,
      });

      let newCode = "LSP01";
      if (lastProductType) {
        const lastCodeNumber = parseInt(lastProductType.code.substring(3));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10
            ? `LSP0${nextCodeNumber}`
            : `LSP${nextCodeNumber}`;
      }

      const productType = new ProductType({ code: newCode, name, description });
      await productType.save();
      return res.status(201).send(productType);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  getAll: async (req, res) => {
    try {
      const roomTypes = await ProductType.find();
      return res.status(200).send(roomTypes);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
};
module.exports = roomTypeController;
