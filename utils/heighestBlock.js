const connectDB = require("../db");
const Block = require("../models/Block");

connectDB();
const heighestBlock = async () => {
  const _heighestBlock = await Block.find().sort({ blockNumber: -1 }).limit(1);

  if (_heighestBlock.length > 0) {
    return _heighestBlock[0].blockNumber;
  }

  return 0;
};

module.exports = { heighestBlock };
