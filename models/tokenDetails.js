const mongoose = require("mongoose");


const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  phone: { type: String, ref: "usersInfo", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
    collection:"Token"
});

mongoose.model("Token", tokenSchema);
