const Product = require("../models/Product");
const { update } = require("./movieController");
const uploadImageS3 = require("./upLoadImageS3Controller");

const Room = require("../models/Room");
const RoomSize = require("../models/RoomSize");

const productController = {
  generateSeat: async (req, res) => {
    try {
      const { roomCode, roomSizeCode } = req.body;

      // Kiểm tra Room có tồn tại không
      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Kiểm tra RoomSize có tồn tại không
      const roomSize = await RoomSize.findOne({ code: roomSizeCode });
      if (!roomSize) {
        return res.status(404).json({ message: "RoomSize not found" });
      }

      // Xác định số lượng hàng, cột dựa trên kích cỡ phòng
      let rows, columns;
      const roomSizeName = roomSize.name.toLowerCase(); // Chuyển thành chữ thường để so sánh
      if (roomSizeName === "nhỏ") {
        rows = 6;
        columns = 8;
      } else if (roomSizeName === "vừa") {
        rows = 8;
        columns = 10;
      } else if (roomSizeName === "lớn") {
        rows = 10;
        columns = 12;
      } else {
        return res.status(400).json({ message: "Invalid room size name" });
      }

      // Tạo ghế dựa trên quy tắc
      for (let row = 1; row <= rows; row++) {
        let isLastRow = row === rows; // Kiểm tra xem có phải dòng cuối không

        for (let col = 1; col <= columns; col++) {
          let productTypeCode = "LSP01"; // Ghế thường
          let seatImage =
            "https://td-cinemas.s3.ap-southeast-1.amazonaws.com/Seat.png"; // Hình ghế thường
          let seatName = "Ghế Thường"; // Tên mặc định ghế thường

          // Phòng nhỏ: tất cả là ghế VIP
          if (roomSizeName === "nhỏ") {
            productTypeCode = "LSP02"; // Ghế VIP
            seatImage =
              "https://td-cinemas.s3.ap-southeast-1.amazonaws.com/seat_vip.png"; // Hình ghế VIP
            seatName = "Ghế VIP"; // Tên ghế VIP
          } else if (roomSizeName === "vừa" || roomSizeName === "lớn") {
            // Phòng vừa và lớn:
            if (isLastRow) {
              // Hàng cuối cùng là ghế đôi
              if (col % 2 === 1) {
                productTypeCode = "LSP03"; // Ghế đôi
                seatImage =
                  "https://td-cinemas.s3.ap-southeast-1.amazonaws.com/seat_couple.png"; // Hình ghế đôi
                seatName = "Ghế đôi"; // Tên ghế đôi
              } else {
                continue; // Bỏ qua cột ghế thứ 2 của ghế đôi
              }
            } else if (row > 3) {
              // Các hàng sau hàng thứ 3 là ghế VIP
              productTypeCode = "LSP02"; // Ghế VIP
              seatImage =
                "https://td-cinemas.s3.ap-southeast-1.amazonaws.com/seat_vip.png"; // Hình ghế VIP
              seatName = "Ghế VIP"; // Tên ghế VIP
            }
          }

          // Tạo mã tự động cho sản phẩm (mã ghế)
          const lastProduct = await Product.findOne({ type: 0 }).sort({
            productId: -1,
          });
          let newCode = "GHE01";
          if (lastProduct) {
            const lastCodeNumber = parseInt(lastProduct.code.substring(3));
            const nextCodeNumber = lastCodeNumber + 1;
            newCode =
              nextCodeNumber < 10
                ? `GHE0${nextCodeNumber}`
                : `GHE${nextCodeNumber}`;
          }

          // Tạo sản phẩm (ghế) mới
          const newSeat = new Product({
            code: newCode, // Mã tự động
            name: seatName, // Tên ghế
            image: seatImage, // Hình ảnh ghế
            roomCode: roomCode, // Mã phòng
            row: row, // Số hàng
            column: col, // Số cột
            type: 0, // Ghế
            productTypeCode: productTypeCode, // Loại ghế
            status: 1, // Kích hoạt
          });

          // Lưu sản phẩm (ghế) mới
          await newSeat.save();
        }
      }

      return res.status(201).json({ message: "Seats created successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllSeatsByRoomCode: async (req, res) => {
    try {
      const { roomCode } = req.params; // Get roomCode from request params

      // Find products where roomCode matches and type represents seats (assuming type field is used for differentiation)
      const seats = await Product.find({ roomCode, type: 0 }); // Assuming type=1 represents seats

      if (!seats || seats.length === 0) {
        return res
          .status(404)
          .json({ message: "No seats found for this room." });
      }

      return res.status(200).json(seats);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving seats.", error });
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

      const lastProduct = await Product.findOne({ type: { $ne: 0 } }).sort({
        productId: -1,
      });

      let newCode = "SP01";
      if (lastProduct) {
        const lastCodeNumber = parseInt(lastProduct.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `SP0${nextCodeNumber}` : `SP${nextCodeNumber}`;
      }
      const existName = await Product.findOne({ name: name });
      if (existName) {
        return res.status(401).json({ message: "Sản phẩm đã tồn tại!" });
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
      const existName = await Product.findOne({ name: name });
      if (existName) {
        return res.status(401).json({ message: "Sản phẩm đã tồn tại!" });
      }
      const lastProduct = await Product.findOne({ type: { $ne: 0 } }).sort({
        code: -1,
      });
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
      const existName = await Product.findOne({ name: name });
      if (existName) {
        return res.status(401).json({ message: "Sản phẩm đã tồn tại!" });
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
      const existName = await Product.findOne({ name: name });
      if (existName) {
        return res.status(401).json({ message: "Sản phẩm đã tồn tại!" });
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
      const { code } = req.params;
      const product = await Product.findOne({ code: code });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.status !== 0) {
        return res
          .status(401)
          .json({ message: "Active product cannot be deleted" });
      }

      const deletedProduct = await Product.delete({ code: code });

      return res.status(200).json({
        message: "Product deleted successfully",
        data: deletedProduct,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  restore: async (req, res) => {
    try {
      const { code } = req.params; // Lấy code của cinema từ URL

      const restoredProduct = await Product.restore({ code: code });

      if (!restoredProduct) {
        return res
          .status(401)
          .json({ message: "Product not found or not deleted" });
      }

      return res.status(200).json({
        message: "Product restored successfully",
        data: restoredProduct,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error restoring product", error });
    }
  },
  deleteAllByTypeZero: async (req, res) => {
    try {
      const result = await Product.deleteMany({ type: 0 });
      console.log(
        `${result.deletedCount} products with type = 0 have been deleted.`
      );
      return res.status(200).send({ message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting products:", error);
    }
  },
};

module.exports = productController;
