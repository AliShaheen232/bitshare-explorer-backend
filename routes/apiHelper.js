const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");
const connectDB = require("../db");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Block = require("../models/Block");
const OperationCount = require("../models/OperationCount");
const objects = require("../utils/DTO.json");
const transactionController = require("./transactionController");
// const getOperationType = require("../utils/operationType");
// const computeTxHash = require("../utils/computeTxHash");
// const getAssetBalance = require("../utils/updateRRCBalance");
// const { fetchAccountHistory } = require("../utils/accountHistory");
// const getPublicKey = require("../utils/getPublicKey");
// const accountController = require("./accountController");

// connectDB();

const updateBlockEntry = async (block_number) => {
  let existingBlock = await Block.findOne({
    block_number,
  });

  let txCount = 0;
  let blockObj;
  let _txObjects = [];

  if (existingBlock) {
    const entries = await Transaction.find({ block_number });

    entries.forEach((entry) => {
      _txObjects.push(transactionController.refineTx(entry));
    });

    blockObj = refineBlock(existingBlock);

    blockObj = {
      ...blockObj,
      transaction_count: existingBlock.transaction_count,
      transactions: _txObjects,
    };

    return blockObj;
  }

  let block = await Apis.instance().db_api().exec("get_block", [block_number]);

  if (block == null) return null;

  if (Array.isArray(block.transactions)) {
    txCount = block.transactions.length;

    for (let i = 0; i < txCount; i++) {
      let tx = {
        block_number,
        timestamp: new Date(block.timestamp),
        ...block.transactions[i],
      };
      tx = await transactionController.updateTransactionEntry(tx);
      _txObjects.push(transactionController.refineTx(tx));
    }
  }

  blockObj = refineBlock({ block_number, txCount, ...block });
  const newBlock = new Block(blockObj);
  await newBlock.save();
  blockObj = { ...blockObj, transactions: _txObjects };
  return blockObj;
};

// const updateAccountDetail = async (accountsIden) => {
//   const balanceObj = await getAssetBalance(accountsIden);
//   let accountObject = [];
//   const accounts = await Apis.instance()
//     .db_api()
//     .exec("get_accounts", [[accountsIden]]);

//   for (let i = 0; i < accounts.length; i++) {
//     if (accounts[i] == null) return null;
//     let public_key = null;
//     if (accounts[i].owner.key_auths.length > 0) {
//       public_key = accounts[i].owner.key_auths[0][0];
//     } else {
//       public_key = accounts[i].name;
//     }

//     objects.account = {
//       account_id: accounts[i].id,
//       name: accounts[i].name,
//       public_key,
//       balance: balanceObj.balance,
//       creation_time: new Date(accounts[i].creation_time),
//       data: accounts[i],
//     };

//     accountObject.push(objects.account);

//     const existingAccount = await Account.findOne({
//       account_id: objects.account.account_id,
//     });

//     if (!existingAccount) {
//       const newAccount = new Account(objects.account);
//       await newAccount.save();
//     }
//   }

//   return accountObject;
// };

// const updateAccountEntry = async (accountsIden, limit) => {
//   if (/^(BTS|RRC)[0-9A-Za-z]{50,55}$/.test(accountsIden)) {
//     // if (/^[1-9A-HJ-NP-Za-km-z1-9]{1,55}$/.test(accountsIden)) {
//     let keyRef = await Apis.instance()
//       .db_api()
//       .exec("get_key_references", [[accountsIden]]);
//     accountsIden = keyRef[0][0];
//   }

//   let accountObject = await updateAccountDetail(accountsIden);
//   const historyObj = await fetchAccountHistory(accountsIden, limit);

//   return {
//     account: accountObject[0],
//     history: historyObj.history,
//   };
// };

const refineBlock = (blockObj) => {
  objects.block = {
    block_number: blockObj.block_number,
    previous: blockObj.previous,
    timestamp: blockObj.timestamp,
    witness: blockObj.witness,
    transaction_merkle_root: blockObj.transaction_merkle_root,
    witness_signature: blockObj.witness_signature,
    transaction_count: blockObj.txCount,
  };

  return objects.block;
};

const getPaginatedBlocks = async (page, limit) => {
  const skip = (page - 1) * limit;
  const blocks = await Block.find()
    .sort({ block_number: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  for (let i = 0; i < blocks.length; i++) {
    delete blocks[i].createdAt;
    delete blocks[i].__v;
    delete blocks[i]._id;

    const entries = await Transaction.find({
      block_number: blocks[i].block_number,
    });

    let _txObjects = [];

    entries.forEach((entry) => {
      _txObjects.push(transactionController.refineTx(entry));
    });

    blocks[i] = {
      ...blocks[i],
      transactions: _txObjects,
    };
  }

  const pagBlockObject = {
    page,
    count: await Block.countDocuments(),
    blocks,
  };

  return pagBlockObject;
};

// const getPaginatedAccounts = async (page, limit) => {
//   const skip = (page - 1) * limit;
//   const accounts = await Account.find()
//     .sort({ balance: -1 })
//     .skip(skip)
//     .limit(limit);

//   const pagAccountObject = {
//     page,
//     count: await Account.countDocuments(),
//     accounts,
//   };

//   return pagAccountObject;
// };

const getStat = async () => {
  let operationsCount = await OperationCount.findOne({}).lean();
  if (operationsCount == null) {
    await _createOperationCountDoc();
  }

  delete operationsCount.createdAt;
  delete operationsCount.__v;
  delete operationsCount._id;

  let operationsTotalCount = 0;

  for (const key in operationsCount) {
    if (typeof operationsCount[key] === "number") {
      operationsTotalCount += operationsCount[key];
    }
  }

  const assetName = "RRC";
  const asset = await fetchAssetByName(assetName);

  const totalSupply = asset.dynamic_asset_data_id
    ? await Apis.instance()
        .db_api()
        .exec("get_objects", [[asset.dynamic_asset_data_id]])
    : null;

  const readableDetails = {
    symbol: asset.symbol,
    max_supply: asset.options.max_supply / Math.pow(10, asset.precision),
    current_supply: totalSupply
      ? totalSupply[0].current_supply / Math.pow(10, asset.precision)
      : "N/A",
    precision: asset.precision,
  };

  return {
    TPS: 0,
    accountCount: await Account.countDocuments(),
    blocksCount: await Block.countDocuments(),
    transactionsCount: await Transaction.countDocuments(),
    operationsTotalCount,
    operationsCount,
    RRC: readableDetails,
  };
};

const latestBlock = async () => {
  try {
    const blockchain = await Apis.instance()
      .db_api()
      .exec("get_dynamic_global_properties", []);
    return blockchain.head_block_number - 7;
  } catch (error) {
    logError(`Error in latestBlock: ${error.message}`);
    throw error;
  }
};

const fetchAssetByName = async (name) => {
  try {
    const asset = await Apis.instance()
      .db_api()
      .exec("lookup_asset_symbols", [[name]]);
    return asset[0];
  } catch (error) {
    console.error(`Error fetching asset: ${error.message}`);
    throw error;
  }
};

const getTotalAssets = async () => {
  let assets = [];
  assets = await Apis.instance().db_api().exec("list_assets", [0, 25]);

  return assets;
};

const fetchAssetHolders = async () => {
  await initializeWebSocket();
  try {
    const holders = await Apis.instance()
      .db_api()
      .exec("get_asset_holders", ["RR", 0, 25]);
    return holders;
  } catch (error) {
    console.error(`Error fetching asset holders: ${error.message}`);
    throw error;
  }
};

module.exports = {
  updateBlockEntry,
  // updateTransactionEntry,
  // updateAccountEntry,
  // updateAccountDetail,
  // getPaginatedAccounts,
  getPaginatedBlocks,
  // getPaginatedTransactions,
  // getLatestTransactions,
  getTotalAssets,
  getStat,
  fetchAssetByName,
  fetchAssetHolders,
};
