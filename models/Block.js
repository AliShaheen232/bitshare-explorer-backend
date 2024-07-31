const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema({
  block_number: { type: Number, required: true },
  previous: { type: String, required: true },
  witness: { type: String, required: true },
  witness_signature: { type: String, required: true },
  transaction_merkle_root: { type: String, required: true },
  transaction_count: { type: Number, required: false },
  timestamp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Block", BlockSchema);
