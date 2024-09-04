const Block = require("../models/Block");

const blockTxsGraph = async () => {
  try {
    let ltstBlksTxs = [];
    const latestBlocks = await Block.find()
      .sort({ block_number: -1 })
      .limit(10);

    latestBlocks.map((latestBlock) => {
      ltstBlksTxs.push({
        block_number: latestBlock.block_number,
        transaction_count: latestBlock.transaction_count,
        timestamp: latestBlock.timestamp,
      });
    });
    return ltstBlksTxs;
  } catch (error) {
    console.error(`Error fetching latest blocks data: ${error.message}`);
    throw error;
  }
};

module.exports = blockTxsGraph;
