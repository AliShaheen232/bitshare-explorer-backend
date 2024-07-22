module.exports = {
  apps: [
    {
      name: "blockindexer",
      script: "./indexer/blockIndexer.js",
      watch: true, // Optional: enables watching file changes to restart the app
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "server",
      script: "./server.js",
      watch: true, // Optional: enables watching file changes to restart the app
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
