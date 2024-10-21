const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    province_name: String,
    province_id: String,
    district_name: String,
    district_id: String,
    ward_name: String,
    ward_id: String,
  },
  {
    collection: "locations",
  }
);

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
