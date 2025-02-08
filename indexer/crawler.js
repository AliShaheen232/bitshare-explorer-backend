const { Apis } = require("bitsharesjs-ws");
const connect = require("../connectNode");
const connectDB = require("../db");
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

        } else {
          console.log(`No new block. last block number: ${_lastBlockNumber}`);
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 1500);
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
