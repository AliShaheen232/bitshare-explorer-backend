require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");

const initializeWebSocket = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true)
    .init_promise.then((res) => {
      let nodeRes = res[0];
      console.log(`Connected to BitShares node: ${wsNode}`, nodeRes);
    })
    .catch((error) => {
      console.error("Failed to establish WebSocket connection:", error);
    });
};

module.exports = initializeWebSocket;
