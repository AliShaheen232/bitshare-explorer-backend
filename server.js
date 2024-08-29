const express = require("express");
const { Apis } = require("bitsharesjs-ws");
const apiRoutes = require("./routes/api");
const { swaggerUi, swaggerDocs } = require("./swagger");
const app = express();
const cors = require("cors");
require("dotenv").config();

const maxRetries = 5;
const reconnectInterval = 5000;
let nodeRes;
const port = process.env.PORT || 3001;

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
      throw new Error("Max retries reached. Unable to connect.");
    }
  }
};

(async () => {
  try {
    await connect();
  } catch (error) {
    console.error("Error:", error);
  }
})();

const initializeWebSocket = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true)
    .init_promise.then((res) => {
      nodeRes = res[0];
      console.log(`Connected to BitShares node: ${wsNode}`, nodeRes);
    })
    .catch((error) => {
      console.error("Failed to establish WebSocket connection:", error);
    });
};

// Enable CORS for all routes
app.use(cors());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send({
    project: "Bitshares Blockchain explorer",
    network_name: nodeRes.network_name,
    network: nodeRes.network,
  });
});

app.set("port", port);

app.listen(port, () => {
  console.log(`BitShares Explorer backend listening at http://0.0.0.0:${port}`);
});

// module.exports = app;
