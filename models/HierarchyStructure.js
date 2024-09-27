const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const HierarchyStructureSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: "hierarchy_structures",
  }
);

// Add plugins
HierarchyStructureSchema.plugin(AutoIncrement, {
  inc_field: "hierarchyStructureId",
});

HierarchyStructureSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

const HierarchyStructure = mongoose.model(
  "HierarchyStructure",
  HierarchyStructureSchema
);
module.exports = HierarchyStructure;
