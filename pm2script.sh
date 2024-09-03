pm2 kill

fuser -k 3333/tcp
fuser -k 5500/tcp

rm -rf indexer/log_blockIndexer.log
rm -rf indexer/log_transactionIndexer.log

pm2 start ./server.js
pm2 start ./scripts/index.js
pm2 start indexer/blockIndexer.js
pm2 start indexer/blockCrawler.js
pm2 start indexer/transactionIndexer.js
pm2 start indexer/accountIndexer.js

pm2 logs