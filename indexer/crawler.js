const { Apis } = require("bitsharesjs-ws");
const connect = require("../connectNode");
const connectDB = require("../db");
// const transactionController = require("../routes/transactionController");
const apiHelper = require("../routes/apiHelper");
const fs = require("fs");
const path = require("path");

connectDB();
const maxRetries = 9;
let retryCount = 0;

const logFile = path.join(__dirname, "log_crawler.log");

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

// const delay = (ms) => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// };

// const getLatestTransactions = async (block_number) => {
//   const block = await Apis.instance()
//     .db_api()
//     .exec("get_block", [block_number]);

//   if (block == null) return null;

//   let txs = [];
//   if (Array.isArray(block.transactions)) {
//     txCount = block.transactions.length;
//     console.log(
//       `Transaction indexer: block number is ${block_number} and transactions count are ${txCount}`
//     );

//     for (let i = 0; i < txCount; i++) {
//       let tx = {
//         block_number,
//         timestamp: new Date(block.timestamp),
//         ...block.transactions[i],
//       };
//       tx = await transactionController.updateTransactionEntry(tx);
//       txs.push(tx);
//     }
//   }

//   return txs;
// };

const crawler = async () => {
  try {
    logInfo(`DB syncing started with latest blocks and transactions`);

    let _lastBlockNumber = (await latestBlock()) - 1;
    setInterval(async () => {
      try {
        const currentBlockNumber = await latestBlock();
        if (_lastBlockNumber < currentBlockNumber) {
          _lastBlockNumber++;
          await apiHelper.updateBlockEntry(currentBlockNumber);

          console.log(`Crawler: new block ${_lastBlockNumber} added in DB`);

          // await getLatestTransactions(_lastBlockNumber);
        } else {
          console.log(`No new block. last block number: ${_lastBlockNumber}`);
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 1000);
  } catch (error) {
    logError(`Error in indexer function: ${error.message}`);
    if (retryCount < maxRetries) {
      retryCount++;
      logInfo(`Retrying crawler... Attempt ${retryCount}`);
      setTimeout(crawler, 9000);
    } else {
      logError("Max retries reached. Exiting crawler.");
      process.exit(1);
    }
  }
};

// module.exports = blockindexer;

(async () => {
  try {
    await connect();
    await crawler();
  } catch (error) {
    console.error("Error:", error);
  }
})();
