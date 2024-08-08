const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  account_id: { type: String, required: true },
  public_key: { type: String, required: true },
  name: { type: String, required: true },
  bakance: { type: Number, required: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Account", AccountSchema);
