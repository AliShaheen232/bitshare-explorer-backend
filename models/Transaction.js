const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  blockNumber: { type: Number, required: false },
  ref_block_num: { type: Number, required: true },
  ref_block_prefix: { type: Number, required: true },
  expiration: { type: String, required: true },
  signatures: { type: Array, required: true },
  operations_count: { type: Number, required: true },
  operations: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
