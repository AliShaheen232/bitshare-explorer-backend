const { Apis } = require("bitsharesjs-ws");
const connectToBitShares = require("../connectNode");

async function getAssetBalance(accountId, assetSymbol) {
  try {
    const asset = (
      await Apis.instance()
        .db_api()
        .exec("lookup_asset_symbols", [[assetSymbol]])
    )[0];

    if (!asset) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    const assetId = asset.id;

    // Get account balances
    const balances = await Apis.instance()
      .db_api()
      .exec("get_account_balances", [accountId, [assetId]]);

    if (balances.length === 0) {
      return { asset: assetSymbol, balance: 0 };
    }

    const balance = balances[0].amount / Math.pow(10, asset.precision);

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

// Example usage
module.exports = getAssetBalance;
