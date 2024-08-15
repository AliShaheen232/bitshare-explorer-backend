const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");

const fetchAssetHolders = async () => {
  await initializeWebSocket();
  try {
    const holders = await Apis.instance()
      .db_api()
      .exec("get_asset_holders", ["RRC", 1, 25]);
    console.log("🚀 ~ fetchAssetHolders 10 ~ holders:", holders);
    return holders;
  } catch (error) {
    console.error(`Error fetching asset holders: ${error.message}`);
    throw error;
  }
};

fetchAssetHolders();
// module.exports = { fetchAssetHolders };
