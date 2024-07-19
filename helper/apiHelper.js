const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Block = require("../models/Block");
const objects = require("./DTO.json");

connectDB();

const updateBlockEntry = async (blockNumber) => {
  const block = await Apis.instance().db_api().exec("get_block", [blockNumber]);

  if (block == null) return null;

  const existingBlock = await Block.findOne({
    blockNumber: blockNumber,
  });

  const txCount = block.transactions.length;
  console.log("🚀 ~ updateBlockEntry ~ txCount:", txCount);

  objects.block = {
    blockNumber: blockNumber,
    previous: block.previous,
    witness: block.witness,
    witness_signature: block.witness_signature,
    transaction_merkle_root: block.transaction_merkle_root,
    transaction_count: txCount,
    timestamp: block.timestamp,
  };

  for (let i = 0; i < txCount; i++) {
    const tx = block.transactions[i];
    await updateTransactionEntry(tx);
  }

  if (!existingBlock) {
    const newBlock = new Block(objects.block);
    await newBlock.save();
    return objects.block;
  } else {
    return objects.block;
  }
};

const updateTransactionEntry = async (transaction) => {
  const existingTransaction = await Transaction.findOne({
    signatures: transaction.signatures[0],
  });

  objects.transaction = {
    ref_block_num: transaction.ref_block_num,
    ref_block_prefix: transaction.ref_block_prefix,
    expiration: transaction.expiration,
    signatures: transaction.signatures,
    operations_count: transaction.operations.length,
    operations: transaction.operations,
  };

  if (!existingTransaction) {
    const newTransaction = new Transaction(objects.transaction);
    await newTransaction.save();
    return objects.transaction;
  } else {
    return objects.transaction;
  }
};

const updateAccountEntry = async (accountsIden) => {
  const accounts = await Apis.instance()
    .db_api()
    .exec("get_accounts", [accountsIden]);
  console.log("🚀 ~ updateAccountEntry ~ accounts:", accounts);

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

module.exports = {
  updateBlockEntry,
  updateTransactionEntry,
  updateAccountEntry,
};
