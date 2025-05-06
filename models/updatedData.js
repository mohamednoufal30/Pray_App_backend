const mongoose = require('mongoose');

const mosqueupdatedSchema = new mongoose.Schema(
  {
    mosqueName: {
      type: String,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: Number, // or ObjectId or String, depending on your user system
      required: true
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "UpdatedMosqueInfo"
  }
);

module.exports = mongoose.model("Mosque", mosqueupdatedSchema);

