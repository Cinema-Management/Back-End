const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ProductSchema = new Schema(
  {
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    image: { type: String, required: false, trim: true },

    roomCode: { type: String, ref: "Room", trim: true },
    seatNumber: { type: String, required: false, trim: true },
    row: { type: Number, required: false },
    column: { type: Number, required: false },

    comboItems: [
      {
        code: { type: String, ref: "Product" },
        quantity: { type: Number, required: false, min: 1 },
      },
    ],

    type: { type: Number, required: true }, // 0: seat, 1:food, 2: combo
    status: { type: Number },
  },
  {
    timestamps: true,
  }
);

// helper function
function generateSeatNumber(row, column) {
  const rowLetter = String.fromCharCode(64 + row);
  return `${rowLetter}${column}`;
}

// middleware
ProductSchema.pre("save", function (next) {
  // Validation for type = 0 (seat)
  if (this.type === 0) {
    if (!this.roomCode || !this.row || !this.column) {
      return next(
        new Error(
          "RoomCode, Row, and Column are required for seat type (type = 0)"
        )
      );
    }
    this.seatNumber = generateSeatNumber(this.row, this.column);
  } else {
    // Clear seat fields if not type 0
    this.roomCode = undefined;
    this.seatNumber = undefined;
    this.row = undefined;
    this.column = undefined;
  }

  // Validation for type = 2 (combo)
  if (this.type === 2) {
    if (!this.comboItems || this.comboItems.length === 0) {
      return next(
        new Error("Combo items are required for combo type (type = 2)")
      );
    }
  } else {
    // Clear combo items if not type 2
    this.comboItems = undefined;
  }
  if (this.isNew && this.status === undefined) {
    this.status = this.type === 0 ? 1 : 0;
  }

  next();
});

ProductSchema.methods.toJSON = function () {
  const product = this.toObject();

  if (product.type !== 2) {
    delete product.comboItems;
  }

  return product;
};

// Add plugins

ProductSchema.plugin(AutoIncrement, { inc_field: "productId" });

ProductSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
