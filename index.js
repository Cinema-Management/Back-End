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
app.use("/api/user", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/cinemas", cinemaRoute);
app.use("/api/room-type", roomTypeRoute);
app.use("/api/room", roomRoute);
app.use("/api/hierarchy-structures", hierarchyStructureRoute);
app.use("/api/hierarchy-values", hierarchyValueRoute);

app.get("/", (req, res) => {
  return res.send("Hello World");
});

app.use(function (req, res) {
  res.status(404).send("Not found");
});
const listener = app.listen(PORT, () => {
  console.log(`Server is running on port ${listener.address().port}`);
});
