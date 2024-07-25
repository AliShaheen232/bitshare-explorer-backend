const mongoose = require("mongoose");

const OperationCountSchema = new mongoose.Schema({
  transfer: { type: Number, default: 0, required: false },
  account_create: { type: Number, default: 0, required: false },
  account_update: { type: Number, default: 0, required: false },
  account_upgrade: { type: Number, default: 0, required: false },
  asset_update_bitasset: { type: Number, default: 0, required: false },
  mining: { type: Number, default: 0, required: false },
  witness_update: { type: Number, default: 0, required: false },
  witness_create: { type: Number, default: 0, required: false },
  worker_create: { type: Number, default: 0, required: false },
  assert: { type: Number, default: 0, required: false },
  balance_claim: { type: Number, default: 0, required: false },
  override_transfer: { type: Number, default: 0, required: false },
  transfer_to_blind: { type: Number, default: 0, required: false },
  blind_transfer: { type: Number, default: 0, required: false },
  transfer_from_blind: { type: Number, default: 0, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OperationCount", OperationCountSchema);

// transfer: { type: Number, required: false },
// account_create: { type: Number, required: false },
// account_update: { type: Number, required: false },
// account_upgrade: { type: Number, required: false },
// asset_update_bitasset: { type: Number, required: false },
// mining: { type: Number, required: false },
// witness_update: { type: Number, required: false },
// witness_create: { type: Number, required: false },
// worker_create: { type: Number, required: false },
// assert: { type: Number, required: false },
// balance_claim: { type: Number, required: false },
// override_transfer: { type: Number, required: false },
// transfer_to_blind: { type: Number, required: false },
// blind_transfer: { type: Number, required: false },
// transfer_from_blind: { type: Number, required: false },
