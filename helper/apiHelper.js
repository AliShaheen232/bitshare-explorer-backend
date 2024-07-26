const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Block = require("../models/Block");
const OperationCount = require("../models/OperationCount");
const objects = require("./DTO.json");
const getOperationType = require("./operationType");
// const mongoose = require("mongoose");

connectDB();

const updateBlockEntry = async (blockNumber) => {
  let existingBlock = await Block.findOne({
    blockNumber,
  });

  let txCount = 0;
  let blockObj;
  let _txObjects = [];

  if (existingBlock) {
    const entries = await Transaction.find({ blockNumber });
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

  let block = await Apis.instance().db_api().exec("get_block", [blockNumber]);

  if (block == null) return null;

  if (Array.isArray(block.transactions)) {
    txCount = block.transactions.length;

    for (let i = 0; i < txCount; i++) {
      let tx = { blockNumber, ...block.transactions[i] };
      tx = await updateTransactionEntry(tx);
      _txObjects.push(refineTx(tx));
    }
  }

  blockObj = refineBlock({ blockNumber, txCount, ...block });
  const newBlock = new Block(blockObj);
  await newBlock.save();
  blockObj = { ...blockObj, transactions: _txObjects };
  return blockObj;
};

const updateTransactionEntry = async (transaction) => {
  const existingTransaction = await Transaction.findOne({
    signatures: transaction.signatures[0],
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

  _txObject = _refineTx(transaction);

  const newTransaction = new Transaction(_txObject);
  await newTransaction.save();
  return _txObject;
};

const updateAccountEntry = async (accountsIden) => {
  const accounts = await Apis.instance()
    .db_api()
    .exec("get_accounts", [accountsIden]);

  let accountObject = [];

  for (let i = 0; i < accounts.length; i++) {
    objects.account = {
      account_id: accounts[i].id,
      name: accounts[i].name,
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
  // else {
  //   existingDoc = await _createOperationCountDoc();
  //   await _updateOperationType(type);
  // }
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

// const _createOperationCountDoc = async () => {
//   const newOperationDoc = new OperationCount();
//   await newOperationDoc.save();
//   return newOperationDoc;
// };

const refineTx = (txObj) => {
  objects.transaction = {
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
  let blockNumber;
  if ("blockNumber" in txObj) {
    blockNumber = txObj.blockNumber;
  } else {
    blockNumber = null;
  }
  objects.transaction = {
    blockNumber,
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
    blockNumber: blockObj.blockNumber,
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

module.exports = {
  updateBlockEntry,
  updateTransactionEntry,
  updateAccountEntry,
  getPaginatedBlocks,
  getPaginatedTransactions,
  getPaginatedAccounts,
  getStat,
};
