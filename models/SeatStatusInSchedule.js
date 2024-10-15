const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const SeatStatusInScheduleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
    },
    productCode: {
      type: String,
      required: true,
      ref: "Product",
    },
    scheduleCode: {
      type: String,
      required: true,
      ref: "Schedule", // Tham chiếu đến bảng Screening
    },
    status: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "seat_status_in_schedules",
  }
);

// Add plugins
SeatStatusInScheduleSchema.plugin(AutoIncrement, {
  inc_field: "seatStatusInScheduleId",
});

SeatStatusInScheduleSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});
const SeatStatusInSchedule = mongoose.model(
  "SeatStatusInSchedule",
  SeatStatusInScheduleSchema
);

module.exports = SeatStatusInSchedule;
