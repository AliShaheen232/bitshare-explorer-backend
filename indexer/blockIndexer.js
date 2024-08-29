const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");
const connect = require("../connectNode");
const connectDB = require("../db");
const apiHelper = require("../routes/apiHelper");
const Block = require("../models/Block");
const OperationCount = require("../models/OperationCount");
const readFile = require("./readFile");

connectDB();

const logFile = path.join(__dirname, "log_blockIndexer.log");

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

const heighestBlock = async () => {
  let _heighestBlock = readFile.readFromFile();

  if (!_heighestBlock) {
    _heighestBlock = await Block.find().sort({ block_number: -1 }).limit(1);
    if (_heighestBlock.length > 0) {
      return _heighestBlock[0].block_number;
    } else {
      return 0;
    }
  }
  return _heighestBlock;
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

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const indexing = async () => {
  try {
    const _headBlockNumber = await latestBlock();
    // let _heighestBlock = 90000;
    let _heighestBlock = await heighestBlock();

    logInfo(
      `Starting indexer with _heighestBlock: ${_heighestBlock}, _headBlockNumber: ${_headBlockNumber}`
    );

    for (_heighestBlock; _heighestBlock <= _headBlockNumber; _heighestBlock++) {
      await apiHelper.updateBlockEntry(_heighestBlock);
      console.log(`indexing ~ Updated block: ${_heighestBlock}`);
      readFile.writeToFile(_heighestBlock);
      // await delay(0);
    }
    logInfo(`Initial loop ends: ${_heighestBlock}`);
  } catch (error) {
    readFile.writeToFile(_heighestBlock);
    logError(`Error in indexing: ${error.message}`);
  }
};

const blockIndexer = async () => {
  try {
    logInfo(`DB syncing started`);
    await _createOperationCountDoc();
    await indexing();

    await findMissing();

    logInfo(`DB syncing completed`);

    logInfo(`Updating DB with new blocks`);

    let _lastBlockNumber = 0;
    setInterval(async () => {
      try {
        let currentBlockNumber = await latestBlock();
        if (currentBlockNumber > _lastBlockNumber) {
          await apiHelper.updateBlockEntry(currentBlockNumber);
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

const _createOperationCountDoc = async () => {
  let existingDoc = await OperationCount.findOne({});
  if (!existingDoc) {
    const newOperationDoc = new OperationCount();
    await newOperationDoc.save();
    return newOperationDoc;
  } else {
    return existingDoc;
  }
};

const findMissing = async () => {
  try {
    let _heighestBlock = await heighestBlock();
    let _lowestBlock = 1;
    logInfo(`Finding missing blocks in DB`);

    for (_lowestBlock; _lowestBlock <= _heighestBlock; _lowestBlock++) {
      let existingBlock = await Block.findOne({ block_number: _lowestBlock });

      if (!existingBlock) {
        await apiHelper.updateBlockEntry(_lowestBlock);
        console.log("findMissing ~ Missed Block updated", _lowestBlock);
      }
      existingBlock = await Block.findOne({ block_number: _lowestBlock });
    }
  } catch (error) {
    logError(`Error in findMissing: ${error.message}`);
  }
};

(async () => {
  try {
    await connect();
    await blockIndexer();
  } catch (error) {
    console.error("Error:", error);
  }
})();

// module.exports = blockindexer;
