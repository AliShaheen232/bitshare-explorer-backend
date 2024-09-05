const fs = require("fs");
const path = require("path");
const { Apis } = require("bitsharesjs-ws");
const connect = require("../connectNode");
const connectDB = require("../db");
const apiHelper = require("../routes/apiHelper");

connectDB();

const maxRetries = 9;
let retryCount = 0;

const logFile = path.join(__dirname, "log_blockCrawler.log");

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
    return blockchain.head_block_number;
  } catch (error) {
    logError(`Error in latestBlock: ${error.message}`);
    throw error;
  }
};

const blockCrawler = async () => {
  try {
    logInfo(`Blocks crawler started`);

    let _lastBlockNumber = 0;
    setInterval(async () => {
      try {
        let currentBlockNumber = await latestBlock();
        if (_lastBlockNumber < currentBlockNumber) {
          await apiHelper.updateBlockEntry(currentBlockNumber);
          console.log(
            "🚀 ~ setInterval ~ currentBlockNumber:",
            currentBlockNumber
          );
          _lastBlockNumber = currentBlockNumber;
        } else {
          console.log(
            `blockCrawler ~ No new block. Current block number: ${currentBlockNumber}`
          );
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 1500);
  } catch (error) {
    logError(
      `Error in blockCrawler function: ${error.message} \n ${error.stack}`
    );

    if (retryCount < maxRetries) {
      retryCount++;
      logInfo(`Retrying blockCrawler... Attempt ${retryCount}`);
      setTimeout(blockCrawler, 9000);
    } else {
      logError("Max retries reached. Exiting blockCrawler.");
      process.exit(1);
    }
  }
};

(async () => {
  try {
    await connect();
    await blockCrawler();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1); // Exit the process on initialization error
  }
})();
