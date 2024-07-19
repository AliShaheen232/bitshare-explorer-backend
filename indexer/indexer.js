require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const { heighestBlock } = require("../helper/heighestBlock");
const { updateBlockEntry } = require("../helper/apiHelper");

connectDB();

const indexer = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true).init_promise;

  let _headBlockNumber = await latestBlock();
  let _heighestBlock = await heighestBlock();
  let _lastBlockNumber = 0;

  console.log(
    "🚀 ~ produceMessages ~ _heighestBlock:",
    _headBlockNumber,
    _heighestBlock,
    _headBlockNumber - _heighestBlock
  );

  for (_heighestBlock; _heighestBlock <= _headBlockNumber; _heighestBlock++) {
    await updateBlockEntry(_heighestBlock);
    console.log("🚀 ~ indexer ~ _heighestBlock:", _heighestBlock);
    await delay(0);
  }
  console.log("loop ends");

  setInterval(async () => {
    let currentBlockNumber = await latestBlock();
    if (currentBlockNumber > _lastBlockNumber) {
      await updateBlockEntry(currentBlockNumber);
      console.log("🚀 ~ setInterval ~ currentBlockNumber:", currentBlockNumber);
      _lastBlockNumber = currentBlockNumber;
    } else {
      console.log("No New Block", currentBlockNumber);
    }
  }, 1000);
};

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const latestBlock = async () => {
  const blockchain = await Apis.instance()
    .db_api()
    .exec("get_dynamic_global_properties", []);
  return blockchain.head_block_number;
};

indexer();
