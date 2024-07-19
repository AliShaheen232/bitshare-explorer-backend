const server = require("./server");

const startServer = () => {
  server.listen(server.get("port"), () => {
    console.log(
      `BitShares Explorer backend listening at http://0.0.0.0:${server.get(
        "port"
      )}`
    );
  });
};

startServer();
