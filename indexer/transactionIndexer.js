const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");
const connectDB = require("../db");
const apiHelper = require("../helper/apiHelper");
const fs = require("fs");
const path = require("path");

connectDB();

const logFile = path.join(__dirname, "log_transactionIndexer.log");

const logError = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

const logInfo = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] INFO: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

const latestBlock = async () => {
  try {
    const blockchain = await Apis.instance()
      .db_api()
      .exec("get_dynamic_global_properties", []);
    return blockchain.head_block_number - 7;
  } catch (error) {
    logError(`Error in latestBlock: ${error.message}`);
    throw error;
  }
};

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getLatestTransactions = async () => {
  const block_number = await latestBlock();

  const block = await Apis.instance()
    .db_api()
    .exec("get_block", [block_number]);

  if (block == null) return null;

  let txs = [];
  if (Array.isArray(block.transactions)) {
    txCount = block.transactions.length;

    for (let i = 0; i < txCount; i++) {
      let tx = { block_number, ...block.transactions[i] };
      tx = await apiHelper.updateTransactionEntry(tx);
      txs.push(tx);
    }
  }

  console.log(" getLatestTransactions ~ txs:", txs);
  return txs;
};

const blockIndexer = async () => {
  try {
    logInfo(`DB syncing started with latest transactions`);
    await initializeWebSocket();

    logInfo(`Updating DB with new transactions`);

    let _lastBlockNumber = 0;
    setInterval(async () => {
      try {
        let currentBlockNumber = await latestBlock();
        if (currentBlockNumber > _lastBlockNumber) {
          console.log(
            "setInterval ~ New block's transaction updated:",
            currentBlockNumber
          );
          await getLatestTransactions();
          _lastBlockNumber = currentBlockNumber;
        } else {
          console.log(
            `setInterval ~ No new block. Current block number: ${currentBlockNumber}`
          );
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 1000);
  } catch (error) {
    // Log any errors that occur
    logError(`Error in indexer function: ${error.message}`);
    blockIndexer();
  }
};

// module.exports = blockindexer;
blockIndexer();
