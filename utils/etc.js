const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");

const latestBlock = async () => {
  try {
    await initializeWebSocket();
    setInterval(async () => {
      const blockchain = await Apis.instance()
        .db_api()
        .exec("get_dynamic_global_properties", []);
      console.log(
        "🚀 ~ latestBlock ~ blockchain.head_block_number:",
        blockchain.head_block_number
      );
      return blockchain.head_block_number;
    }, 3000);
  } catch (error) {
    logError(`Error in latestBlock: ${error.message}`);
    throw error;
  }
};

latestBlock();
