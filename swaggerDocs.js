/**
 * @swagger
 * /api/identify/{input}:
 *   get:
 *     summary: Retrieve Block number, Transaction hash, Account ID, or Account name data
 *     description: Get Block number, Transaction hash, Account ID, or Account name data within blockchain
 *     parameters:
 *       - in: path
 *         name: input
 *         required: true
 *         description: Block number, Transaction hash, Account ID, or Account name to retrieve
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
 *     description: Get the total number of accounts registered within the blockchain
 *     responses:
 *       200:
 *         description: Accounts count
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/account/{accountIdent}:
 *   get:
 *     summary: Retrieve account data
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
// /**
//  * @swagger
//  * /api/account/{accountRef}:
//  *   get:
//  *     summary: Retrieve account data
//  *     description: Retrieve account data by account references
//  *     parameters:
//  *       - in: path
//  *         name: accountRef
//  *         required: true
//  *         description: Name of the account to retrieve
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Account data
//  *       500:
//  *         description: Server error
//  */
/**
 * @swagger
 * /api/block/{blockNum}:
 *   get:
 *     summary: Retrieve block data
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
 *     description: Retrieve the chain ID of the blockchain
 *     responses:
 *       200:
 *         description: Chain ID
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieve the config.
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
