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
    return blockchain.head_block_number - 1;
  } catch (error) {
    logError(`Error in latestBlock: ${error.message}`);
    throw error;
  }
};


const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getLatestTransactions = async (block_number) => {
  const block = await Apis.instance()
    .db_api()
    .exec("get_block", [block_number]);

  if (block == null) return null;

  let txs = [];
  if (Array.isArray(block.transactions)) {
    txCount = block.transactions.length;
    console.log(
      `Transaction indexer: block number is ${block_number} and transactions count are ${txCount}`
    );

    for (let i = 0; i < txCount; i++) {
      let tx = { block_number, ...block.transactions[i] };
      tx = await apiHelper.updateTransactionEntry(tx);
      txs.push(tx);
    }
  }

  return txs;
};

const transactionIndexer = async () => {
  try {
    logInfo(`DB syncing started with latest transactions`);
    await initializeWebSocket();

    logInfo(`Updating DB with new transactions`);

    let _lastBlockNumber = (await latestBlock()) - 1;
    setInterval(async () => {
      try {
        const currentBlockNumber = await latestBlock();
        if (_lastBlockNumber < currentBlockNumber) {
          _lastBlockNumber++;
          await getLatestTransactions(_lastBlockNumber);
        } else {
          console.log(`No new block. last block number: ${_lastBlockNumber}`);
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 1000);
  } catch (error) {
    logError(`Error in indexer function: ${error.message}`);
    setTimeout(transactionIndexer, 5000); // Retry after 5 seconds
  }
};
// module.exports = blockindexer;
transactionIndexer();
