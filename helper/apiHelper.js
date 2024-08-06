const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");
const connectDB = require("../db");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Block = require("../models/Block");
const OperationCount = require("../models/OperationCount");
const objects = require("./DTO.json");
const getOperationType = require("./operationType");
const computeTxHash = require("./computeTxHash");

connectDB();

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
      _txObjects.push(refineTx(entry));
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
      let tx = { block_number, ...block.transactions[i] };
      tx = await updateTransactionEntry(tx);
      _txObjects.push(refineTx(tx));
    }
  }

  blockObj = refineBlock({ block_number, txCount, ...block });
  const newBlock = new Block(blockObj);
  await newBlock.save();
  blockObj = { ...blockObj, transactions: _txObjects };
  return blockObj;
};

const updateTransactionEntry = async (transaction) => {
  let transaction_hash = "";

  if ("transaction_hash" in transaction) {
    transaction_hash = transaction.transaction_hash;
  } else {
    transaction_hash = computeTxHash(transaction);
  }

  const existingTransaction = await Transaction.findOne({
    transaction_hash,
  });

  let _txObject;

  if (existingTransaction) {
    _txObject = _refineTx(transaction);

    return _txObject;
  }

  transaction.operations.forEach(async (operation) => {
    const operationType = operation[0];
    const operationData = operation[1];
    const operationName = getOperationType(operationType);

    await updateOperationType(operationName);

    // for operation type read "./operationType.js"

    if (operationType == 5) {
      console.log(`93 ${operationName}`, operationData);

      await updateAccountEntry(operationData.name);
    }
  });

  _txObject = _refineTx({ transaction_hash, ...transaction });

  const newTransaction = new Transaction(_txObject);
  await newTransaction.save();
  return _txObject;
};

const updateAccountEntry = async (accountsIden) => {
  if (/^[1-9A-HJ-NP-Za-km-z1-9]{1,55}$/.test(accountsIden)) {
    let keyRef = await Apis.instance()
      .db_api()
      .exec("get_key_references", [[accountsIden]]);
    accountsIden = keyRef[0][0];
  }

  let accountObject = [];
  const accounts = await Apis.instance()
    .db_api()
    .exec("get_accounts", [[accountsIden]]);

  for (let i = 0; i < accounts.length; i++) {
    objects.account = {
      account_id: accounts[i].id,
      name: accounts[i].name,
      public_key: accounts[i].owner.key_auths[0][0],
      data: accounts[i],
    };

    accountObject.push(objects.account);

    const existingAccount = await Account.findOne({
      account_id: objects.account.account_id,
    });

    if (!existingAccount) {
      const newAccount = new Account(objects.account);
      await newAccount.save();
    }
  }

  return accountObject;
};

const updateOperationType = async (type) => {
  let existingDoc = await OperationCount.findOne({});

  if (existingDoc) {
    await _updateOperationType(type);
    return;
  }
};

const _updateOperationType = async (type) => {
  const updateObject = {};
  updateObject[type] = 1;
  await OperationCount.findOneAndUpdate(
    {},
    { $inc: updateObject },
    { new: true, upsert: true }
  );
};

const refineTx = (txObj) => {
  objects.transaction = {
    transaction_hash: txObj.transaction_hash,
    ref_block_num: txObj.ref_block_num,
    ref_block_prefix: txObj.ref_block_prefix,
    expiration: txObj.expiration,
    signatures: txObj.signatures,
    operations_count: txObj.operations.length,
    operations: txObj.operations,
  };

  return objects.transaction;
};

const _refineTx = (txObj) => {
  let block_number = txObj.block_number || null;

  for (let i = 0; i < txObj.operations.length; i++) {
    const operationType =
      txObj.operations[i].operationType || txObj.operations[i][0];
    const operationData =
      txObj.operations[i].operationData || txObj.operations[i][1];

    let operation = { operationType };

    if ("amount" in operationData) {
      operation.amount = operationData.amount;
      delete operationData.amount;
    }

    if ("memo" in operationData) {
      operation.memo = operationData.memo;
      delete operationData.memo;
    }

    operation.operationData = operationData;

    txObj.operations[i] = operation;
  }

  objects.transaction = {
    transaction_hash: txObj.transaction_hash,
    block_number,
    ref_block_num: txObj.ref_block_num,
    ref_block_prefix: txObj.ref_block_prefix,
    expiration: txObj.expiration,
    signatures: txObj.signatures,
    operations_count: txObj.operations.length,
    operations: txObj.operations,
  };

  return objects.transaction;
};

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
    .sort({ createdAt: -1 })
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
      _txObjects.push(refineTx(entry));
    });

    blocks[i] = refineBlock(blocks[i]);
    blocks[i] = {
      ...blocks[i],
      transaction_count: blocks[i].transaction_count,
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

const getPaginatedTransactions = async (page, limit) => {
  const skip = (page - 1) * limit;
  const txs = await Transaction.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
  for (let i = 0; i < txs.length; i++) {
    delete txs[i].createdAt;
    delete txs[i].__v;
    delete txs[i]._id;
  }
  const pagTXObject = {
    page,
    count: await Transaction.countDocuments(),
    txs,
  };
  return pagTXObject;
};

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

  return {
    TPS: 0,
    accountCount: await Account.countDocuments(),
    blocksCount: await Block.countDocuments(),
    transactionsCount: await Transaction.countDocuments(),
    operationsTotalCount,
    operationsCount,
  };
  // statObject;
};

const getPaginatedAccounts = async (page, limit) => {
  const skip = (page - 1) * limit;
  const accounts = await Account.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const pagAccountObject = {
    page,
    count: await Account.countDocuments(),
    accounts,
  };
  return pagAccountObject;
};

const getPublicKeys = async (username) => {
  try {
    const existingAccount = await Account.findOne({
      name: username,
    });

    if (existingAccount) {
      return existingAccount.public_key;
    } else {
      const account = await Apis.instance()
        .db_api()
        .exec("get_account_by_name", [username]);

      if (!account) {
        console.error("Account not existed");
        return;
      }

      // Extract public keys from the account details
      const ownerPubKey = account.owner.key_auths[0][0];
      // const activePubKey = account.active.key_auths[0][0];
      // const memoPubKey = account.options.memo_key;

      return ownerPubKey;
    }
  } catch (error) {
    console.error("Error fetching account details:", error.message);
  }
};

const getLatestTransactions = async () => {
  const block_number = await latestBlock();

  const block = await Apis.instance()
    .db_api()
    .exec("get_block", [block_number]);

  if (block == null) return null;

  let txs = [];
  if (Array.isArray(block.transactions)) {
    txCount = block.transactions.length;

    for (let i = 0; i < txCount; i++) {
      let tx = { block_number, ...block.transactions[i] };
      tx = await updateTransactionEntry(tx);
      txs.push(tx);
    }
  }

  return txs;
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
  updateTransactionEntry,
  updateAccountEntry,
  getPaginatedBlocks,
  getPaginatedTransactions,
  getPaginatedAccounts,
  getLatestTransactions,
  getTotalAssets,
  getStat,
  getPublicKeys,
  fetchAssetByName,
  fetchAssetHolders,
};
