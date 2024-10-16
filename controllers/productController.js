const Product = require("../models/Product");
const { update } = require("./movieController");
const uploadImageS3 = require("./upLoadImageS3Controller");

const Room = require("../models/Room");
const RoomSize = require("../models/RoomSize");
const Schedule = require("../models/Schedule");
const Price = require("../models/Price");

const PriceDetail = require("../models/PriceDetail");

function determineTimeSlot(startTime, dayOfWeek) {
  // Nếu là thứ Hai (dayOfWeek = 2), trả về 1 cho 'Cả ngày'
  if (dayOfWeek === 2) {
    return 1; // Cả ngày
  }

  const hour = new Date(startTime).getHours(); // Lấy giờ từ startTime
  if (hour < 17) {
    return 2; // Trước 17h
  }
  return 3; // Sau 17h
}
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
      const { roomCode } = req.params; // Nhận mã phòng từ params

      // Tìm tất cả sản phẩm theo mã roomCode và type đại diện cho ghế ngồi (giả sử type = 0 là ghế)
      const productsWithStatus = await Product.aggregate([
        {
          // Bước 1: Lọc sản phẩm theo roomCode và type = 0 (ghế)
          $match: {
            roomCode: roomCode,
            type: 0,
          },
        },
        {
          // Bước 2: Kết hợp với bảng SeatStatusInSchedule dựa trên mã sản phẩm
          $lookup: {
            from: "seat_status_in_schedules", // Tên bảng SeatStatusInSchedule
            localField: "code", // Trường trong Product
            foreignField: "productCode", // Trường liên kết trong SeatStatusInSchedule
            as: "seatStatus", // Tên trường sau khi kết hợp
          },
        },
        {
          // Bước 3: Tính toán lại trạng thái của ghế
          $project: {
            code: 1, // Giữ mã sản phẩm
            name: 1, // Giữ tên sản phẩm
            seatNumber: 1, // Giữ số ghế
            image: 1, // Giữ hình ảnh
            status: 1,
            seatStatus: {
              $cond: {
                if: {
                  // Kiểm tra xem có bất kỳ status nào khác 1 không
                  $anyElementTrue: {
                    $map: {
                      input: "$seatStatus", // Mảng seatStatus
                      as: "statusItem",
                      in: { $ne: ["$$statusItem.status", 1] }, // Trả về true nếu khác 1
                    },
                  },
                },
                then: 1, // Nếu có status nào khác 1, trả về 1 đã có suất chiếu
                else: 0, // Nếu tất cả đều là 1, trả về 1 chưa có suất chiếu
              },
            },
          },
        },
      ]);

      if (!productsWithStatus || productsWithStatus.length === 0) {
        return res
          .status(404)
          .json({ message: "No seats found for this room." });
      }

      return res.status(200).json(productsWithStatus);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error retrieving seats.", error });
    }
  },

  getAllSeatsByRoomCodeAndScheduleCode: async (req, res) => {
    try {
      const { roomCode } = req.params;
      const { scheduleCode } = req.query;
      // Lấy roomCode và scheduleCode từ tham số yêu cầu

      // Lấy thông tin lịch chiếu để lấy thông tin ngày và khung giờ
      const schedule = await Schedule.findOne({ code: scheduleCode }); // Tìm theo scheduleCode
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found." });
      }
      console.log(schedule);

      const dayOfWeek = schedule.date.getDay(); // Lấy ngày trong tuần từ date (0-6)
      console.log("dayOfWeek", dayOfWeek);

      const timeSlot = determineTimeSlot(schedule.startTime, dayOfWeek); // Hàm xác định khung giờ
      console.log("timeSlot", timeSlot);

      // Tìm các sản phẩm (ghế) với roomCode, type=0 (ghế),
      const seats = await Product.find({ roomCode, type: 0 });
      console.log("so luong ghe", seats.length);
      if (!seats || seats.length === 0) {
        return res
          .status(404)
          .json({ message: "No seats found for this room." });
      }

      // Tìm bảng giá chi tiết cho ghế
      const prices = await Price.find({
        type: "0", // So sánh với type
        status: 1, // So sánh với status
        dayOfWeek: { $in: [dayOfWeek] }, // So sánh với dayOfWeek
        timeSlot: timeSlot, // So sánh với timeSlot
        startDate: { $lte: schedule.date }, // startDate <= schedule.date
        endDate: { $gte: schedule.date }, // endDate >= schedule.date
      });
      console.log("so prices", prices.length);

      const priceDetails = await PriceDetail.find({
        priceCode: { $in: prices.map((price) => price.code) }, // So sánh với mã giá
        roomTypeCode: schedule.screeningFormatCode, // So sánh với mã loại phòng
        // productTypeCode: { $in: seats.map((seat) => seat.productTypeCode) }, // So sánh với productTypeCode của ghế
      });
      console.log("so priceDetails", priceDetails.length);

      // Gộp giá vào danh sách ghế
      const seatsWithPrices = seats.map((seat) => {
        const priceDetail = priceDetails.find(
          (price) => price.productTypeCode === seat.productTypeCode // Tìm giá tương ứng cho từng ghế
        );
        return {
          ...seat.toObject(), // Chuyển đổi ghế thành đối tượng thuần
          price: priceDetail ? priceDetail.price : 0, // Thêm giá nếu có
          priceDetailCode: priceDetail ? priceDetail.code : null, // Thêm mã giá nếu có
        };
      });

      return res.status(200).json(seatsWithPrices);
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

  getNotSeatPrice: async (req, res) => {
    try {
      // Bước 1: Tìm các sản phẩm không phải ghế
      const products = await Product.find({ type: { $ne: 0 } });

      // Bước 2: Tạo map để lưu tên sản phẩm
      const productMap = {};
      const allProducts = await Product.find();
      allProducts.forEach((product) => {
        productMap[product.code] = product.name;
      });

      // Bước 3: Tạo kết quả cho sản phẩm và lấy comboItemNames
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

      // Bước 4: Lấy ngày hiện tại
      const currentDate = new Date();
      const prices = await Price.find({
        type: "1",
        status: 1,
        startDate: { $lte: currentDate }, // Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hiện tại
        endDate: { $gte: currentDate }, // Ngày kết thúc phải lớn hơn hoặc bằng ngày hiện tại
      });

      // Bước 5: Lấy chi tiết giá theo mã giá
      const priceCodes = prices.map((price) => price.code);
      const priceDetails = await PriceDetail.find({
        priceCode: { $in: priceCodes }, // Tìm tất cả priceDetail có priceCode trong mảng
      });

      // In ra số lượng priceDetails cho debug

      // Bước 6: Kết hợp sản phẩm với giá
      const resultPrice = result.map((product) => {
        // Tìm chi tiết giá tương ứng với từng sản phẩm
        const priceDetail = priceDetails.find(
          (price) => price.productCode === product.code // So sánh mã sản phẩm
        );

        return {
          ...product, // Chuyển đổi ghế thành đối tượng thuần
          price: priceDetail ? priceDetail.price : 0, // Thêm giá nếu có
          priceDetailCode: priceDetail ? priceDetail.code : null, // Thêm mã giá nếu có
        };
      });

      // Bước 7: Gửi kết quả về client
      res.json(resultPrice);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  add: async (req, res) => {
    try {
      const { name, description, type } = req.body;

      const lastProductArray = await Product.findWithDeleted({
        type: { $ne: 0 },
      })
        .sort({
          productId: -1,
        })
        .limit(1)
        .lean();
      const lastProduct = lastProductArray[0];
      let newCode = "SP01";
      if (lastProduct && lastProduct.code) {
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

      const lastProductArray = await Product.findWithDeleted({
        type: { $ne: 0 },
      })
        .sort({
          code: -1,
        })
        .limit(1)
        .lean();
      const lastProduct = lastProductArray[0];
      let newCode = "SP01";
      if (lastProduct && lastProduct.code) {
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
      const { name, description, comboItems, type, status } = req.body;
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
      if (status && status !== product.status) {
        product.status = status;
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
      const {
        name,
        description,
        roomCode,
        row,
        column,
        comboItems,
        type,
        status,
      } = req.body;

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
      if (status && status !== product.status) {
        product.status = status;
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
  getAllNotSeatStatusActive: async (req, res) => {
    try {
      const products = await Product.find({
        type: { $ne: 0 },
        status: 1,
      }).select("code name");

      res.json(products);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  deleteSeatByRoomCode: async (req, res) => {
    try {
      const { roomCode } = req.params; // Lấy roomCode từ req.params

      // Tìm tất cả các sản phẩm có roomCode tương ứng
      const products = await Product.find({ roomCode: roomCode });

      if (products.length === 0) {
        return res
          .status(404)
          .json({ message: "No products found for this roomCode" });
      }

      // Xóa tất cả các sản phẩm có roomCode tương ứng và status = 0
      const deletedProducts = await Product.deleteMany({ roomCode: roomCode });

      return res.status(200).json({
        message: "All products with this roomCode deleted successfully",
        data: deletedProducts,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = productController;
