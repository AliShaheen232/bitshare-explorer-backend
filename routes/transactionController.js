const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Block = require("../models/Block");
const OperationCount = require("../models/OperationCount");
const objects = require("../utils/DTO.json");
const getOperationType = require("../utils/operationType");
const computeTxHash = require("../utils/computeTxHash");
const getAssetBalance = require("../utils/updateRRCBalance");
const getPublicKey = require("../utils/getPublicKey");
const accountController = require("./accountController");
// const initializeWebSocket = require("../connectNode");
// const { fetchAccountHistory } = require("../utils/accountHistory");

connectDB();

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

      await accountController.updateAccountDetail(operationData.name);
    }
  });

  _txObject = await _refineTx({ transaction_hash, ...transaction });

  const newTransaction = new Transaction(_txObject);
  await newTransaction.save();
  return _txObject;
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
  let timestamp = txObj.timestamp;
  if (!(timestamp instanceof Date)) {
    timestamp = new Date(timestamp);
  }

  objects.transaction = {
    transaction_hash: txObj.transaction_hash,
    ref_block_num: txObj.ref_block_num,
    ref_block_prefix: txObj.ref_block_prefix,
    timestamp,
    expiration: txObj.expiration,
    signatures: txObj.signatures,
    operations_count: txObj.operations.length,
    operations: txObj.operations,
  };

  return objects.transaction;
};

const _refineTx = async (txObj) => {
  let timestamp = txObj.timestamp;

  if (timestamp === undefined) {
    timestamp = new Date();
  }

  let block_number = txObj.block_number || null;

  for (let i = 0; i < txObj.operations.length; i++) {
    const operationData =
      txObj.operations[i].operationData || txObj.operations[i][1];

    const operationType =
      txObj.operations[i].operationType !== undefined
        ? txObj.operations[i].operationType
        : txObj.operations[i][0];

    let operation = { operationType };

    operation.amount = txObj.operations[i].amount || undefined;
    operation.memo = txObj.operations[i].memo || undefined;

    if ("amount" in operationData) {
      operationData.amount.asset_id =
        operationData.amount.asset_id === "1.3.1"
          ? "RRC"
          : operationData.amount.asset_id;

      operationData.amount.amount = formatAmount(
        Number(operationData.amount.amount)
      );

      operation.amount = operationData.amount;
      delete operationData.amount;
    }

    if ("memo" in operationData) {
      operation.memo = operationData.memo;
      delete operationData.memo;
    }

    if ("fee" in operationData) {
      operationData.fee.asset_id =
        operationData.fee.asset_id === "1.3.0"
          ? "BTS"
          : operationData.fee.asset_id;
    }

    if ("asset_to_issue" in operationData) {
      operationData.asset_to_issue.asset_id =
        operationData.asset_to_issue.asset_id === "1.3.1"
          ? "RRC"
          : operationData.asset_to_issue.asset_id;

      await getAssetBalance(operationData.issue_to_account);

      operationData.asset_to_issue.amount = formatAmount(
        Number(operationData.asset_to_issue.amount)
      );
    }

    if ("from" in operationData) {
      await getAssetBalance(operationData.from);
      await getAssetBalance(operationData.to);

      operationData.from =
        (await getPublicKey(operationData.from)) || operationData.from;

      operationData.to =
        (await getPublicKey(operationData.to)) || operationData.to;
    }

    // if (operationType == 15)
    if ("payer" in operationData) {
      await getAssetBalance(operationData.payer);

      operationData.payer =
        (await getPublicKey(operationData.payer)) || operationData.payer;

      operationData.amount_to_reserve.asset_id =
        operationData.amount_to_reserve.asset_id === "1.3.1"
          ? "RRC"
          : operationData.amount_to_reserve.asset_id;

      operationData.amount_to_reserve.amount = formatAmount(
        Number(operationData.amount_to_reserve.amount)
      );
    }

    operation.operationData = operationData;

    txObj.operations[i] = operation;
  }

  objects.transaction = {
    transaction_hash: txObj.transaction_hash,
    block_number,
    ref_block_num: txObj.ref_block_num,
    ref_block_prefix: txObj.ref_block_prefix,
    timestamp,
    expiration: txObj.expiration,
    signatures: txObj.signatures,
    operations_count: txObj.operations.length,
    operations: txObj.operations,
  };

  return objects.transaction;
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

const formatAmount = (amount) => {
  const assetPrecision = 6;

  amount = amount / Math.pow(10, assetPrecision);

  let amountStr = amount.toString();

  if (amountStr.includes("e")) {
    amountStr = amount.toFixed(20).replace(/\.?0+$/, "");
  }

  return parseFloat(amountStr);
};

module.exports = {
  updateTransactionEntry,
  getPaginatedTransactions,
  getLatestTransactions,
  refineTx,
};
