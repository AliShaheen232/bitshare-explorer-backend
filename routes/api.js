const express = require("express");
const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const apiHelper = require("../helper/apiHelper");
const AccountCount = require("../models/AccountCount");
const Transaction = require("../models/Transaction");

const router = express.Router();

connectDB();

router.get("/stat", async (req, res) => {
  try {
    const statObject = await apiHelper.getStat();
    res.json(statObject);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/block/:blockNum", async (req, res) => {
  try {
    const blockNumber = req.params.blockNum;

    const block = await _updateBlockEntry(blockNumber);
    res.json(block);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/blocks", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;

    const blocks = await apiHelper.getPaginatedBlocks(page, limit);

    res.json(blocks);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// block.transactions[block.transactions.length - 1].operations.length;
router.get("/txs/:blockNum", async (req, res) => {
  try {
    const blockNumber = req.params.blockNum;

    // let block = await Apis.instance().db_api().exec("get_block", [blockNumber]);

    // if (block == null) return res.json(null);

    // let transactions = [];
    // for (let i = 0; i < block.transactions.length; i++) {

    //   const transaction = await _updateTransactionEntry({
    //     blockNumber,
    //     ...block.transactions[i],
    //   });

    //   transactions.push(transaction);
    // }

    const block = await _updateBlockEntry(blockNumber);
    const txs = block.transactions;

    res.json(txs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/latestBlock", async (req, res) => {
  try {
    const latestBlock = await Apis.instance()
      .db_api()
      .exec("get_dynamic_global_properties", []);

    const blockNumber = latestBlock.head_block_number;

    if (blockNumber == null) return res.json(null);

    const block = await _updateBlockEntry(blockNumber);
    res.json(block);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/account/accountCount", async (req, res) => {
  try {
    const accountCount = await Apis.instance()
      .db_api()
      .exec("get_account_count", []);
    if (accountCount == null) return res.json(null);

    const existingDoc = await AccountCount.findOne({});

    if (existingDoc) {
      if (existingDoc.count == accountCount) {
        existingDoc.count;
        return res.json(accountCount);
      } else {
        existingDoc.count = accountCount;
        await existingDoc.save();
      }
    } else {
      const count = new AccountCount({
        count: accountCount,
      });
      await count.save();
    }

    res.json(accountCount);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/accounts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;

    const accounts = await apiHelper.getPaginatedAccounts(page, limit);

    res.json(accounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/account/fetchPubKey/:username", async (req, res) => {
  try {
    const userName = req.params.username;

    const pubKey = await apiHelper.getPublicKeys(userName);

    res.json(pubKey);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/account/:accountIdent", async (req, res) => {
  try {
    const accountIdents = req.params.accountIdent;

    const accounts = await _updateAccountEntry(accountIdents);

    res.json(accounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/chainID", async (req, res) => {
  try {
    const chainId = await Apis.instance().db_api().exec("get_chain_id", []);
    const chainIdProperties = await Apis.instance()
      .db_api()
      .exec("get_chain_properties", []);

    res.json({
      chain_id: chainId,
      id: chainIdProperties.id,
      immutable_parameters: chainIdProperties.immutable_parameters,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/txs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const transactions = await apiHelper.getPaginatedTransactions(page, limit);

    res.json(transactions);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/tx/:transaction", async (req, res) => {
  try {
    const transactionHash = req.params.transaction;
    const transactionRes = await _updateTransactionEntry(transactionHash);

    res.json(transactionRes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/latest-transactions", async (req, res) => {
  try {
    const transactions = await getLatestTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/globalProperties", async (req, res) => {
  try {
    const globalProperties = await Apis.instance()
      .db_api()
      .exec("get_global_properties", []);

    if (globalProperties == null) return res.json(null);

    res.json(globalProperties);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/config", async (req, res) => {
  try {
    const config = await Apis.instance().db_api().exec("get_config", []);

    res.json(config);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/search/:input", async (req, res) => {
  try {
    const input = req.params.input;
    const resp = await searchInput(input);
    res.json(resp);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/accounts/:lowerBoundName", async (req, res) => {
  const lowerBoundName = req.params.lowerBoundName; // Start with an empty string to get all accounts
  const limit = 10; // Maximum number of results to return
  const result = await Apis.instance()
    .db_api()
    .exec("lookup_accounts", [lowerBoundName, limit]);

  // Call the lookup_accounts API method
  console.log(result);
  return res.json(result);
});

const searchInput = async (input) => {
  input = input.trim();

  if (/^\d+$/.test(input)) {
    return await _updateBlockEntry(input);
  }

  if (/^[0-9a-fA-F]{40}$/.test(input)) {
    return await _updateTransactionEntry(input);
  }

  // account ID check
  if (/^[1-9]+\.\d+\.\d+$/.test(input)) {
    return await _updateAccountEntry(input);
  }

  // account name check
  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return await _updateAccountEntry(input);
  }

  // base58 check
  if (/^[1-9A-HJ-NP-Za-km-z1-9]{1,55}$/.test(input)) {
    return await _updateAccountEntry(input);
  }
  return null;
};

const _updateBlockEntry = async (blockNumber) => {
  return await apiHelper.updateBlockEntry(blockNumber);
};

const _updateTransactionEntry = async (transactionHash) => {
  let transaction;
  const existingTransaction = await Transaction.findOne({
    transaction_hash: transactionHash,
  });

  if (existingTransaction) {
    transaction = await apiHelper.updateTransactionEntry(existingTransaction);
  } else {
    const transaction = await Apis.instance()
      .db_api()
      .exec("get_recent_transaction_by_id", [transactionHash]);
    if (transaction == null) return null;
    transaction = await apiHelper.updateTransactionEntry(transaction);
  }

  return transaction;
};

const _updateAccountEntry = async (account) => {
  return await apiHelper.updateAccountEntry(account);
};

module.exports = router;
