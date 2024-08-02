/**
 * @swagger
 * /api/search/{input}:
 *   get:
 *     summary: Retrieve Block number, Transaction hash, Account ID, or Account name data
 *     tags: [Global]
 *     description: Get Block number, Transaction hash, Account ID, or Account name data within blockchain
 *     parameters:
 *       - in: path
 *         name: input
 *         required: true
 *         description: Block number, Transaction hash, Public key, Account ID, or Account name to retrieve data
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Input result
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/account/accountCount:
 *   get:
 *     summary: Total number of registered accounts
 *     tags: [Accounts]
 *     description: Get the total number of accounts registered within the blockchain
 *     responses:
 *       200:
 *         description: Accounts count
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/account/fetchPubKey/{username}:
 *   get:
 *     summary: Retrieve public keys for a specific account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username of the account to retrieve public keys for
 *     responses:
 *       200:
 *         description: A list of public keys for the specified account
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 description: A public key
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/account/{accountIdent}:
 *   get:
 *     summary: Retrieve account data
 *     tags: [Accounts]
 *     description: Retrieve account data by account name
 *     parameters:
 *       - in: path
 *         name: accountIdent
 *         required: true
 *         description: Identifier of the account to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Retrieve a list of accounts with pagination
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: The number of accounts to retrieve per page
 *     responses:
 *       200:
 *         description: A paginated list of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   account_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   data:
 *                     type: object
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/blocks:
 *   get:
 *     summary: Retrieve a list of blocks with pagination
 *     tags: [Blocks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: The number of blocks to retrieve per page
 *     responses:
 *       200:
 *         description: A paginated list of blocks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   blockNumber:
 *                     type: integer
 *                   previous:
 *                     type: string
 *                   witness:
 *                     type: string
 *                   witness_signature:
 *                     type: string
 *                   transaction_merkle_root:
 *                     type: string
 *                   transaction_count:
 *                     type: integer
 *                   timestamp:
 *                     type: string
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/block/{blockNum}:
 *   get:
 *     summary: Retrieve block data
 *     tags: [Blocks]
 *     description: Retrieve block data by block number
 *     parameters:
 *       - in : path
 *         name : blockNum
 *         required : true
 *         description : Numeric ID of the block to retrieve
 *         schema :
 *           type : integer
 *     responses:
 *       200:
 *         description: Block data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/chainID:
 *   get:
 *     summary: Get chain ID
 *     tags: [Global]
 *     description: Retrieve the chain ID of the blockchain
 *     responses:
 *       200:
 *         description: Chain ID
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Retrieve a paginated list of assets with primary details
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *         description: The starting symbol of the assets to list
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: The number of assets to retrieve
 *     responses:
 *       200:
 *         description: A list of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                   issuer:
 *                     type: string
 *                   precision:
 *                     type: integer
 *                   description:
 *                     type: string
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/assets/{name}:
 *   get:
 *     summary: Retrieve an asset by its name
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the asset to retrieve
 *     responses:
 *       200:
 *         description: An asset object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 symbol:
 *                   type: string
 *                 issuer:
 *                   type: string
 *                 precision:
 *                   type: integer
 *                 options:
 *                   type: object
 *                 dynamic_asset_data_id:
 *                   type: string
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/assets/{assetId}/holders:
 *   get:
 *     summary: Retrieve the list of asset holders
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: assetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the asset to retrieve holders for
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *         description: The starting holder ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: The number of holders to retrieve
 *     responses:
 *       200:
 *         description: A list of asset holders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   account_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   amount:
 *                     type: string
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieve the config.
 *     tags: [Global]
 *     description: Retrieve the config
 *     responses:
 *       200:
 *         description: Get Config of Chain
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/globalProperties:
 *   get:
 *     summary: Retrieve the current global property object.
 *     tags: [Global]
 *     description: Retrieve the current global property object
 *     responses:
 *       200:
 *         description: Global properties
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/latestBlock:
 *   get:
 *     summary: Retrieve block data
 *     tags: [Blocks]
 *     description: Retrieve block data by block number

 *     responses:
 *       200:
 *         description: Latest block data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/txs/{blockNum}:
 *   get:
 *     summary: Retrieve transactions from block
 *     tags: [Transactions]
 *     description: Retrieve transaction data by block number
 *     parameters:
 *       - in : path
 *         name : blockNum
 *         required : true
 *         description : Numeric ID of the block to retrieve
 *         schema :
 *           type : integer
 *     responses:
 *       200:
 *         description: Transactions data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/tx/{transaction}:
 *   get:
 *     summary: Retrieve transaction
 *     tags: [Transactions]
 *     description: Retrieve transaction data by transaction hash
 *     parameters:
 *       - in : path
 *         name : transaction
 *         required : true
 *         description : string of transaction hash to retrieve the transaction data
 *         schema :
 *            type : string
 *     responses:
 *       200:
 *         description: Transaction data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/stat:
 *   get:
 *     summary: Retrieve various blockchain statistics
 *     tags: [Global]
 *     responses:
 *       200:
 *         description: A JSON object containing blockchain statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 TPS:
 *                   type: integer
 *                   description: Transactions per second
 *                 accountCount:
 *                   type: integer
 *                   description: Total number of accounts
 *                 blocksCount:
 *                   type: integer
 *                   description: Total number of blocks
 *                 transactionsCount:
 *                   type: integer
 *                   description: Total number of transactions
 *                 totalTransafers:
 *                   type: integer
 *                   description: Total number of transfers
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/latestTxs:
 *   get:
 *     summary: Retrieve the latest transactions in the BitShares blockchain
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: A list of the latest transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ref_block_num:
 *                     type: integer
 *                   ref_block_prefix:
 *                     type: integer
 *                   expiration:
 *                     type: string
 *                   operations:
 *                     type: array
 *                     items:
 *                       type: array
 *                   signatures:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/txs:
 *   get:
 *     summary: Retrieve a list of transactions with pagination
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: The number of transactions to retrieve per page
 *     responses:
 *       200:
 *         description: A paginated list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   transaction_id:
 *                     type: string
 *                   block_number:
 *                     type: integer
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   sender:
 *                     type: string
 *                   receiver:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   fee:
 *                     type: number
 *                   data:
 *                     type: object
 *       500:
 *         description: Server error
 */
