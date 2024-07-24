module.exports = {
  apps: [
    {
      name: "blockindexer",
      script: "./indexer/blockIndexer.js",
      watch: true,
    },
    {
      name: "server",
      script: "./server.js",
      watch: true,
    },
  ],
};
