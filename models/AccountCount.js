const mongoose = require("mongoose");

const AccountCountSchema = new mongoose.Schema({
  count: { type: Number, require: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AccountCount", AccountCountSchema);
