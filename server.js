const express = require("express");
const apiRoutes = require("./routes/api");
const connect = require("./connectNode");
const { swaggerUi, swaggerDocs } = require("./swagger");
const app = express();
const cors = require("cors");
require("dotenv").config();

let nodeRes;
const port = process.env.PORT || 3001;
(async () => {
  try {
    nodeRes = await connect();
  } catch (error) {
    console.error("Error:", error);
  }
})();

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
