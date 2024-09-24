const multer = require("multer");

const storage = multer.memoryStorage();
const path = require("path");

// Kiểm tra định dạng file
const checkFileType = (file, cb) => {
  const filetype = /jpeg|jpg|png|gif/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Chỉ chấp nhận định dạng ảnh!");
  }
};

// Cấu hình multer
const upload = multer({
  storage,
  limits: { fileSize: 2000000 }, // 2MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});
module.exports = upload;
