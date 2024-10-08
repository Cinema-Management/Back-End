const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 8888;
const mongodb = process.env.MONGODB_URI;
const dbURI = process.env.MONGODB_URI;
const movieGenreRoute = require("./routes/movieGenreRoute");
const movieRoute = require("./routes/movieRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const cinemaRoute = require("./routes/cinemaRoute");
const roomTypeRoute = require("./routes/roomTypeRoute");
const roomRoute = require("./routes/roomRoute");
const hierarchyStructureRoute = require("./routes/hierarchyStructureRoute");
const hierarchyValueRoute = require("./routes/hierarchyValueRoute");
const productRoute = require("./routes/productRoute");
const productTypeRoute = require("./routes/productTypeRoute");
const roomSizeRoute = require("./routes/roomSizeRoute");
const audioRoute = require("./routes/audioRoute");
const subtitleRoute = require("./routes/subtitleRoute");
const scheduleRoute = require("./routes/scheduleRoute");
const priceRoute = require("./routes/priceRoute");
const promotionRoute = require("./routes/promotionRoute");
const promotionLineRoute = require("./routes/promotionLineRoute");
const salesInvoiceRoute = require("./routes/salesInvoiceRoute");
const salesInvoiceDetailRoute = require("./routes/salesInvoiceDetailRoute");
const seatStatusInScheduleRoute = require("./routes/seatStatusInScheduleRoute");
const promotionDetailRoute = require("./routes/promotionDetailRoute");

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Connection failed:", error);
  });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
//routes
app.use("/api/movie-genres", movieGenreRoute);
app.use("/api/movies", movieRoute);
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/cinemas", cinemaRoute);
app.use("/api/room-types", roomTypeRoute);
app.use("/api/room-sizes", roomSizeRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/hierarchy-structures", hierarchyStructureRoute);
app.use("/api/hierarchy-values", hierarchyValueRoute);
app.use("/api/products", productRoute);
app.use("/api/product-types", productTypeRoute);
app.use("/api/audios", audioRoute);
app.use("/api/subtitles", subtitleRoute);
app.use("/api/schedules", scheduleRoute);
app.use("/api/prices", priceRoute);
app.use("/api/promotions", promotionRoute);
app.use("/api/promotion-lines", promotionLineRoute);
app.use("/api/sales-invoices", salesInvoiceRoute);
app.use("/api/sales-invoices-details", salesInvoiceDetailRoute);
app.use("/api/seat-status-in-schedules", seatStatusInScheduleRoute);
app.use("/api/promotion-details", promotionDetailRoute);

app.get("/", (req, res) => {
  return res.send("Hello World");
});

app.use(function (req, res) {
  res.status(404).send("Not found");
});
const listener = app.listen(PORT, () => {
  console.log(`Server is running on port ${listener.address().port}`);
});
