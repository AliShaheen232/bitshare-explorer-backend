pm2 kill

pm2 start ./server.js
pm2 start indexer/blockIndexer.js
pm2 start indexer/transactionIndexer.js

pm2 logs