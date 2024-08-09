const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  account_id: { type: String, required: true },
  public_key: { type: String, required: true },
  name: { type: String, required: true },
  balance: { type: Number, required: true },
  creation_time: { type: Date, required: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Account", AccountSchema);
