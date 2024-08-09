const { Apis } = require("bitsharesjs-ws");
const { PublicKey } = require("bitsharesjs");
const connectToBitShares = require("../connectNode");
const { replaceBTSWithRR } = require("./converter");
const computeTxHash = require("./computeTxHash");

function hexToString(hex) {
  hex = hex.replace(/^0x/, "");
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

async function fetchAccountHistory(accountId, limit) {
  // await connectToBitShares();

  let start = "1.11.0";
  const pageLimit = 100; // Max limit per request
  const history = await Apis.instance()
    .history_api()
    .exec("get_account_history", [accountId, start, limit, start]);

  if (history.length === 0) {
    throw `No history found for account with public key ${accountId}`;
  }

  const assetIds = new Set();
  const accountIdsSet = new Set();

  history.forEach((item) => {
    if (item.op[1].fee && item.op[1].fee.asset_id) {
      assetIds.add(item.op[1].fee.asset_id);
    }
    if (item.op[1].amount && item.op[1].amount.asset_id) {
      assetIds.add(item.op[1].amount.asset_id);
    }
    if (item.op[1].from) {
      accountIdsSet.add(item.op[1].from);
    }
    if (item.op[1].to) {
      accountIdsSet.add(item.op[1].to);
    }
  });

  const [assets, accounts] = await Promise.all([
    Apis.instance()
      .db_api()
      .exec("get_assets", [Array.from(assetIds)]),
    Apis.instance()
      .db_api()
      .exec("get_accounts", [Array.from(accountIdsSet)]),
  ]);

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const formattedHistory = await Promise.all(
    history.map(async (item) => {
      const feeAsset = item.op[1].fee && assetMap.get(item.op[1].fee.asset_id);
      const amountAsset =
        item.op[1].amount && assetMap.get(item.op[1].amount.asset_id);
      const fromAccount = item.op[1].from && accountMap.get(item.op[1].from);
      const toAccount = item.op[1].to && accountMap.get(item.op[1].to);

      const memo = item.op[1].memo
        ? {
            from: item.op[1].memo.from,
            to: item.op[1].memo.to,
            nonce: item.op[1].memo.nonce,
            message: hexToString(item.op[1].memo.message),
          }
        : null;

      let from = fromAccount ? fromAccount.name : item.op[1].from;
      let to = toAccount ? toAccount.name : item.op[1].to;
      from = await getPublicKey(from);
      to = await getPublicKey(to);
      let operation = {
        ...item.op,
        1: {
          ...item.op[1],
          fee: item.op[1].fee
            ? {
                ...item.op[1].fee,
                asset_id: feeAsset ? feeAsset.symbol : item.op[1].fee.asset_id,
              }
            : {},
          from,
          to,
          amount: item.op[1].amount
            ? {
                amount: amountAsset
                  ? item.op[1].amount.amount /
                    Math.pow(10, amountAsset.precision)
                  : item.op[1].amount.amount,
                asset_id: amountAsset
                  ? amountAsset.symbol
                  : item.op[1].amount.asset_id,
              }
            : {},
          memo: memo,
        },
      };

      return {
        hash: item.trx_id || item.id,
        blockNumber: item.block_num,
        timestamp: item.block_time,
        transactionId: item.trx_id || item.id,
        operation,
      };
    })
  );

  const updatedHistory = replaceBTSWithRR(formattedHistory);
  const account = await Apis.instance()
    .db_api()
    .exec("get_accounts", [[accountId]]);

  const historyObj = {
    account: await getPublicKey(account[0].name),
    history: updatedHistory,
  };
  return historyObj;
}

const getPublicKey = async (accountID) => {
  const accounts = await Apis.instance()
    .db_api()
    .exec("get_accounts", [[accountID]]);
  let account = Array.isArray(accounts) ? accounts[0] : null;
  return account !== null ? account.owner.key_auths[0][0] : null;
};

module.exports = { fetchAccountHistory };
