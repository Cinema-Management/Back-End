const AWS = require("aws-sdk");
const path = require("path");

// Suppress AWS SDK maintenance mode message
process.env.AWS_SDK_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

const bucketName = process.env.S3_BUCKET_NAME;

// Cấu hình AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

// Hàm upload ảnh lên S3
const uploadImageS3 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject("Không có file nào được tải lên");
    }

    const fileType = path.extname(file.originalname).toLowerCase();
    const filePath = `${Date.now()}${fileType}`; // Tạo tên file duy nhất

    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload ảnh lên S3
    s3.upload(params, (err, data) => {
      if (err) {
        return reject(`Lỗi khi upload lên S3: ${err}`);
      }
      resolve(data.Location); // Trả về URL của ảnh sau khi upload thành công
    });
  });
};
module.exports = uploadImageS3;
