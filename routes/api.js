const express = require("express");
const { Apis } = require("bitsharesjs-ws");
const connectDB = require("../db");
const AccountCount = require("../models/AccountCount");
const {
  updateBlockEntry,
  updateTransactionEntry,
  updateAccountEntry,
  getPaginatedBlocks,
  getPaginatedAccounts,
} = require("../helper/apiHelper");

const router = express.Router();

connectDB();

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

    const blocks = await getPaginatedBlocks(page, limit);
    res.json(blocks);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// block.transactions[block.transactions.length - 1].operations.length;
router.get("/txs/:blockNum", async (req, res) => {
  block = { transaction_merkle_root: "", transactions: [] };
  try {
    const blockNumber = req.params.blockNum;
    let block = await Apis.instance().db_api().exec("get_block", [blockNumber]);

    console.log("🚀 ~ router.get ~ block:", block);

    if (block == null) return res.json(null);

    let transactions = [];
    for (let i = 0; i < block.transactions.length; i++) {
      const transaction = await _updateTransactionEntry(block.transactions[i]);
      transactions.push(transaction);
    }
    res.json(transactions);
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

    const accounts = await getPaginatedAccounts(page, limit);
    res.json(accounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/account/:accountIdent", async (req, res) => {
  try {
    const accountIdents = req.params.accountIdent;
    console.log("🚀 ~ router.get ~ accountIdent:", accountIdents);

    const accounts = await updateAccountEntry([accountIdents]);

    res.json(accounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/chainID", async (req, res) => {
  try {
    console.log("🚀 ~ router.get ~ Apis:", Apis);
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

router.get("/tx/:transaction", async (req, res) => {
  try {
    const transactionHash = req.params.transaction;
    const transaction = await Apis.instance()
      .db_api()
      .exec("get_recent_transaction_by_id", [transactionHash]);
    if (transaction == null) return res.json(null);
    const transactionRes = await _updateTransactionEntry(transaction);

    res.json(transactionRes);
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

router.get("/identify/:input", async (req, res) => {
  try {
    const input = req.params.input;
    const resp = await identifyInput(input);
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

const identifyInput = async (input) => {
  input = input.trim();

  if (/^\d+$/.test(input)) {
    const block = await _updateBlockEntry(input);

    return block;
  }

  if (/^[0-9a-fA-F]{40}$/.test(input)) {
    const transaction = await Apis.instance()
      .db_api()
      .exec("get_recent_transaction_by_id", [input]);

    if (transaction == null) return null;
    const transactionRes = await updateTransactionEntry(transaction);
    return transactionRes;
  }

  if (/^[1-9]+\.\d+\.\d+$/.test(input)) {
    return await _updateAccountEntry([input]);
  }

  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return await _updateAccountEntry([input]);
  }
  return null;
};

const _updateBlockEntry = async (blockNumber) => {
  return await updateBlockEntry(blockNumber);
};

const _updateTransactionEntry = async (transaction) => {
  return await updateTransactionEntry(transaction);
};

const _updateAccountEntry = async (account) => {
  return await updateAccountEntry(account);
};

module.exports = router;

/*
router.get("/account/:accountRef", async (req, res) => {
  try {
    const accountRef = [req.params.accountRef];
    console.log("🚀 ~ router.get ~ accountRef:", accountRef);

    const account = await Apis.instance()
      .db_api()
      .exec("get_account_references", accountRef);

    if (account == null) return res.json(null);

    res.json(account);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
*/
