const express = require("express");
const { Apis } = require("bitsharesjs-ws");
const apiRoutes = require("./routes/api");
const { swaggerUi, swaggerDocs } = require("./swagger");
const app = express();

require("dotenv").config();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

let nodeRes;

// const localNode = "ws://18.184.52.99:8091";
const localNode = process.env.WEBSOCKET_URL;

Apis.instance(localNode, true)
  .init_promise.then((res) => {
    nodeRes = res[0];
    console.log(`Connected to BitShares node: ${localNode}`, nodeRes);
  })
  .catch((err) => {
    console.error(`Error connecting to BitShares node: ${localNode}`, err);
  });

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
