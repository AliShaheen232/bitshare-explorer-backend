require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");

let isTerminating = false;

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

  // Listen for WebSocket connection termination
  Apis.instance().ws_rpc.ws.on("close", () => {
    if (!isTerminating) {
      console.log(
        "WebSocket connection closed unexpectedly. Attempting to reconnect..."
      );
      connect();
    }
  });
};

const maxRetries = 9;
const reconnectInterval = 9000;

const connect = async (retryCount = 0) => {
  try {
    await initializeWebSocket();
    retryCount = 0;
    console.log("Connected successfully.");
  } catch (error) {
    console.error(
      `Connection failed. Attempt ${retryCount + 1} of ${maxRetries}`
    );

    if (retryCount < maxRetries) {
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval));
      await connect(retryCount);
    } else {
      console.error("Max retries reached. Unable to connect.");
      throw new Error("Max retries reached. Unable to connect.");
    }
  }
};

// Handle termination gracefully
process.on("SIGTERM", () => {
  isTerminating = true;
  Apis.instance()
    .close()
    .then(() => {
      console.log("WebSocket connection closed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error closing WebSocket connection:", error);
      process.exit(1);
    });
});

module.exports = connect;
