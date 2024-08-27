const { Apis } = require("bitsharesjs-ws");
const Account = require("../models/Account");
const objects = require("./DTO.json");

async function updateRRCBalance(accountId) {
  try {
    if (/^(BTS|RRC)[0-9A-Za-z]{50,55}$/.test(accountId)) {
      // if (/^[1-9A-HJ-NP-Za-km-z1-9]{1,55}$/.test(accountsIden)) {
      let keyRef = await Apis.instance()
        .db_api()
        .exec("get_key_references", [[accountId]]);
      accountId = keyRef[0][0];
    }
    const assetPrecision = 6;
    const assetSymbol = "RRC";
    const assetId = "1.3.1";

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
    } else {
      await _updateAccountDetail(accountId, balance);
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

const _updateAccountDetail = async (accountsIden, balance) => {
  const accounts = await Apis.instance()
    .db_api()
    .exec("get_accounts", [[accountsIden]]);

  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i] == null) return null;
    let public_key = null;
    if (accounts[i].owner.key_auths.length > 0) {
      public_key = accounts[i].owner.key_auths[0][0];
    } else {
      public_key = accounts[i].name;
    }

    objects.account = {
      account_id: accounts[i].id,
      name: accounts[i].name,
      public_key,
      balance,
      creation_time: new Date(accounts[i].creation_time),
      data: accounts[i],
    };

    const newAccount = new Account(objects.account);
    await newAccount.save();
  }
};

module.exports = updateRRCBalance;
