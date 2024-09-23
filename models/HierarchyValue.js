const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const HierarchyValueSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    parentCode: { type: String, ref: "HierarchyValue", default: null },
    level: { type: Number, required: true },
    hierarchyStructureCode: { type: String, ref: "HierarchyStructure" },
  },
  {
    timestamps: true,
    collection: "hierarchy_values",
  }
);

// Add plugins
HierarchyValueSchema.plugin(AutoIncrement, {
  inc_field: "hierarchyValueId",
});

HierarchyValueSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const HierarchyValue = mongoose.model("HierarchyValue", HierarchyValueSchema);
module.exports = HierarchyValue;
