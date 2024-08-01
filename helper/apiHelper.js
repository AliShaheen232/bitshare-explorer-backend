const { Apis } = require("bitsharesjs-ws");
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
  const hash = computeTxHash(transaction);

  const existingTransaction = await Transaction.findOne({
    transaction_hash: hash,
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
      console.log(`${operationName}`, operation);

      await updateAccountEntry([operationData.name]);
    }

    operation[0] = operationName;
  });
  _txObject = _refineTx({ hash, ...transaction });

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
  let block_number;
  if ("block_number" in txObj) {
    block_number = txObj.block_number;
  } else {
    block_number = null;
  }
  objects.transaction = {
    transaction_hash: txObj.hash,
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
  const blocks = await Block.find().skip(skip).limit(limit).exec();
  const pagBlockObject = {
    page,
    count: await Block.countDocuments(),
    blocks,
  };

  return pagBlockObject;
};

const getPaginatedTransactions = async (page, limit) => {
  const skip = (page - 1) * limit;
  const txs = await Transaction.find().skip(skip).limit(limit).exec();
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
  const accounts = await Account.find().skip(skip).limit(limit);
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

  console.log(" getLatestTransactions ~ txs:", txs);
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

module.exports = {
  updateBlockEntry,
  updateTransactionEntry,
  updateAccountEntry,
  getPaginatedBlocks,
  getPaginatedTransactions,
  getPaginatedAccounts,
  getLatestTransactions,
  getStat,
  getPublicKeys,
};
