const axios = require("axios");

const router = require("express").Router();
const qs = require("qs");
const CryptoJS = require("crypto-js"); // npm install crypto-js
const moment = require("moment"); // npm install moment

// router.post("/", async (req, res) => {
//   //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
//   //parameters
//   //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
//   //parameters
//   var accessKey = "F8BBA842ECF85";
//   var secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
//   var orderInfo = "pay with MoMo";
//   var partnerCode = "MOMO";
//   var redirectUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
//   var ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
//   var amount = "50000";
//   var orderId = partnerCode + new Date().getTime();
//   var requestId = orderId;
//   var extraData = "";
//   var paymentCode =
//     "T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==";
//   var orderGroupId = "";
//   var autoCapture = true;
//   var lang = "vi";

//   //before sign HMAC SHA256 with format
//   //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
//   var rawSignature =
//     "accessKey=" +
//     accessKey +
//     "&amount=" +
//     amount +
//     "&extraData=" +
//     extraData +
//     "&orderId=" +
//     orderId +
//     "&orderInfo=" +
//     orderInfo +
//     "&partnerCode=" +
//     partnerCode +
//     "&paymentCode=" +
//     paymentCode +
//     "&requestId=" +
//     requestId;
//   //puts raw signature
//   console.log("--------------------RAW SIGNATURE----------------");
//   console.log(rawSignature);
//   //signature
//   const crypto = require("crypto");
//   var signature = crypto
//     .createHmac("sha256", secretKey)
//     .update(rawSignature)
//     .digest("hex");
//   console.log("--------------------SIGNATURE----------------");
//   console.log(signature);

//   //json object send to MoMo endpoint
//   const requestBody = JSON.stringify({
//     partnerCode: partnerCode,
//     partnerName: "Test",
//     storeId: "MomoTestStore",
//     requestId: requestId,
//     amount: amount,
//     orderId: orderId,
//     orderInfo: orderInfo,
//     redirectUrl: redirectUrl,
//     ipnUrl: ipnUrl,
//     lang: lang,
//     autoCapture: autoCapture,
//     extraData: extraData,
//     paymentCode: paymentCode,
//     orderGroupId: orderGroupId,
//     signature: signature,
//   });
//   //options for axios
//   const options = {
//     method: "POST",
//     url: "https://test-payment.momo.vn/v2/gateway/api/pos",
//     headers: {
//       "Content-Type": "application/json",
//       "Content-Length": Buffer.byteLength(requestBody),
//     },
//     data: requestBody,
//   };
//   let result;
//   console.log("--------------------REQUEST----------------");

//   try {
//     console.log("--------------------Load----------------");

//     result = await axios(options);
//     console.log("-------------------Success-----------------");

//     res.status(200).json(result.data);
//   } catch (error) {
//     res.status(500).json({
//       statusCode: 500,
//       message: "Internal Server Error",
//     });
//   }
// });

const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  endpointCheck: "https://sb-openapi.zalopay.vn/v2/query",
};

router.post("/payment", async (req, res) => {
  const { amount } = req.body;
  const embed_data = {
    redirecturl: `${process.env.CLIENT_URL}/order`,
    // redirecturl: process.env.URL_EXPO,
  };

  const items = [{}];
  const transID = Math.floor(Math.random() * 1000000);
  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
    app_user: "user123",
    app_time: Date.now(), // miliseconds
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: 1,
    description: `TD Cinema - Thanh toán đơn hàng #${transID}`,
    bank_code: "zalopayapp",
    callback_url: `${process.env.URL_CALLBACK}/api/callback`,
  };

  // appid|app_trans_id|appuser|amount|apptime|embeddata|item
  const data =
    config.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    console.log("-------------------Success-----------------");
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});

router.post("/callback", async (req, res) => {
  let result = {};

  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log("mac =", mac);

    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr, config.key2);
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson["app_trans_id"]
      );

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);
});
router.post("/order-status/:app_tran_id", async (req, res) => {
  const { app_tran_id } = req.params;

  let postData = {
    app_id: config.app_id,
    app_trans_id: app_tran_id, // Input your app_trans_id
  };

  let data = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
  postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  let postConfig = {
    method: "post",
    url: config.endpointCheck,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    console.log("-------------------Success Check Order-----------------");
    console.log(result.data);
    return res.status(200).json(result.data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});
module.exports = router;
