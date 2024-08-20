const { Apis } = require("bitsharesjs-ws");
const Account = require("../models/Account");

async function updateRRCBalance(accountId) {
  try {
    // const asset = (
    //   await Apis.instance()
    //     .db_api()
    //     .exec("lookup_asset_symbols", [[assetSymbol]])
    // )[0];

    // if (!asset) {
    //   throw new Error(`Asset ${assetSymbol} not found`);
    // }
    const assetPrecision = 6;
    const assetSymbol = "RRC";
    const assetId = "1.3.1"; // asset.id

    const balances = await Apis.instance()
      .db_api()
      .exec("get_account_balances", [accountId, [assetId]]);

    if (balances.length === 0) {
      return { asset: assetSymbol, balance: 0 };
    }
    const balance = balances[0].amount / Math.pow(10, assetPrecision);

    const existingAccount = await Account.findOne({
      account_id: accountId,
    });

    if (existingAccount) {
      existingAccount.balance = balance;
    }

    const balanceObj = {
      asset: assetSymbol,
      balance: balance,
    };
    return balanceObj;
  } catch (error) {
    console.error("Error fetching account balance:", error);
    throw error;
  }
}

module.exports = updateRRCBalance;
