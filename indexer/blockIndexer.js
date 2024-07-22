require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const { updateBlockEntry } = require("../helper/apiHelper");
const fs = require("fs");
const Block = require("../models/Block");
const path = require("path");

connectDB();

const logFile = path.join(__dirname, "indexer.log");

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
  const _heighestBlock = await Block.find().sort({ blockNumber: -1 }).limit(1);
  if (_heighestBlock.length > 0) {
    console.log(
      "🚀 ~ heighestBlock ~ _heighestBlock[0].blockNumber:",
      _heighestBlock[0].blockNumber
    );
    return _heighestBlock[0].blockNumber;
  }
  return 0;
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

const lowestBlock = async () => {
  const _lowestBlock = await Block.find().sort({ blockNumber: 1 }).limit(1);
  if (_lowestBlock.length > 0) {
    return _lowestBlock[0].blockNumber;
  }
  return 0;
};

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const initializeWebSocket = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true)
    .init_promise.then((res) => {
      let nodeRes = res[0];
      // console.log(`Connected to BitShares node: ${wsNode}`, nodeRes);
    })
    .catch((error) => {
      logError("Failed to establish WebSocket connection:", error);
    });
};

const indexing = async () => {
  try {
    // await initializeWebSocket();

    let _headBlockNumber = await latestBlock();
    let _heighestBlock = await heighestBlock();

    console.log(
      `Starting indexer with _heighestBlock: ${_heighestBlock}, _headBlockNumber: ${_headBlockNumber}`
    );

    for (_heighestBlock; _heighestBlock <= _headBlockNumber; _heighestBlock++) {
      console.log("🚀 ~ indexing ~ _heighestBlock:", _heighestBlock);
      await updateBlockEntry(_heighestBlock);
      console.log(`Updated block: ${_heighestBlock}`);
      await delay(0);
    }
    logInfo(`Initial loop ends: ${_heighestBlock}`);
  } catch (error) {
    logError(`Error in indexing: ${error.message}`);
  }
};

const blockIndexer = async () => {
  try {
    let _lastBlockNumber = 0;

    logInfo(`DB syncing started`);
    await initializeWebSocket();

    await indexing();

    await findMissing();

    logInfo(`DB syncing completed`);

    logInfo(`Updating DB with new blocks`);

    setInterval(async () => {
      try {
        let currentBlockNumber = await latestBlock();
        if (currentBlockNumber > _lastBlockNumber) {
          await updateBlockEntry(currentBlockNumber);
          _lastBlockNumber = currentBlockNumber;
        } else {
          console.log(
            `No new block. Current block number: ${currentBlockNumber}`
          );
        }
      } catch (error) {
        logError(`Error in setInterval: ${error.message}`);
      }
    }, 0);
  } catch (error) {
    // Log any errors that occur
    logError(`Error in indexer function: ${error.message}`);
    indexer();
  }
};

const findMissing = async () => {
  try {
    // await initializeWebSocket();

    let _heighestBlock = await heighestBlock();
    let _lowestBlock = await lowestBlock();
    logInfo(`Finding missing blocks in DB`);

    for (
      let blockNumber = _lowestBlock;
      blockNumber <= _heighestBlock;
      blockNumber++
    ) {
      let existingBlock = await Block.findOne({ blockNumber });

      if (!existingBlock) {
        await _updateBlockEntry(blockNumber);
      }
      existingBlock = await Block.findOne({ blockNumber });

      await delay(50);
    }
  } catch (error) {
    logError(`Error in findMissing: ${error.message}`);
  }
};

module.exports = blockIndexer;
// blockIndexer();
