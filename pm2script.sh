pm2 kill
 fuser -k 3333/tcp
 
pm2 start ./server.js
pm2 start witnessAndVotes.js
pm2 start indexer/blockIndexer.js
pm2 start indexer/transactionIndexer.js

pm2 logs