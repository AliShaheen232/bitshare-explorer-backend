const Transaction = require("../models/Transaction");

const txsGraph = async () => {
  try {
    let ltstTxs = [];
    const latestTxs = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(10);

    latestTxs.map((latestTx) => {
      ltstTxs.push({
        transaction_hash: latestTx.transaction_hash,
        block_number: latestTx.block_number,
        timestamp: latestTx.timestamp,
      });
    });
    
    return ltstTxs;
  } catch (error) {
    console.error(`Error fetching latest blocks data: ${error.message}`);
    throw error;
  }
};

module.exports = txsGraph;
