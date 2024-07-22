require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const heighestBlock = require("../helper/heighestBlock");
const { updateBlockEntry } = require("../helper/apiHelper");

connectDB();

const accountIndexer = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true).init_promise;
  const accountCount = await Apis.instance()
    .db_api()
    .exec("get_account_count", []);

  for (let i = 0; i <= accountCount; i++) {
    const accounts = await Apis.instance()
      .db_api()
      .exec("lookup_accounts", ["", 1, true]);

    console.log("🚀 ~ indexer ~ accounts:", accounts);
  }
  // console.log("loop ends");

  // setInterval(async () => {
  //   let currentBlockNumber = await latestBlock();
  //   if (currentBlockNumber > _lastBlockNumber) {
  //     await updateBlockEntry(currentBlockNumber);
  //     console.log("   ~ setInterval ~ currentBlockNumber:", currentBlockNumber);
  //     _lastBlockNumber = currentBlockNumber;
  //   } else {
  //     console.log("No New Block", currentBlockNumber);
  //   }
  // }, 1000);
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

// module.exports = indexer;
accountIndexer();
