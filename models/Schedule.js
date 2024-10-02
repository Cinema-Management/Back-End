const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const ScheduleSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    movieCode: {
      type: String,
      ref: "Movie",
      required: true,
      trim: true,
    },
    roomCode: {
      type: String,
      ref: "Room",
      required: true,
      trim: true,
    },
    screeningFormatCode: {
      // Lưu loại suất chiếu
      type: String,
      ref: "RoomType", // Từ room lấy ra loại phòng
      // required: true,
      trim: true,
    },
    subtitleCode: {
      type: String,
      ref: "Subtitle",
      required: false,
      trim: true,
    },
    audioCode: {
      type: String,
      ref: "Audio",
      required: false,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
// Add plugins
ScheduleSchema.plugin(AutoIncrement, { inc_field: "scheduleId" });
ScheduleSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});
const Schedule = mongoose.model("Schedule", ScheduleSchema);
module.exports = Schedule;
