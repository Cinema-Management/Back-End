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
const cinemaRoute = require("./routes/cinemaRoute");
const roomTypeRoute = require("./routes/roomTypeRoute");
const roomRoute = require("./routes/roomRoute");

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
app.use("/v1/movie-genre", movieGenreRoute);
app.use("/v1/movie", movieRoute);
app.use("/v1/cinema", cinemaRoute);
app.use("/v1/room-type", roomTypeRoute);
app.use("/v1/room", roomRoute);

app.get("/", (req, res) => {
  return res.send("Hello World");
});

app.use(function (req, res) {
  res.status(404).send("Not found");
});
const listener = app.listen(PORT, () => {
  console.log(`Server is running on port ${listener.address().port}`);
});
