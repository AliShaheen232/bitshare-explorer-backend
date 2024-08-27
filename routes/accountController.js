const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");
const Account = require("../models/Account");
const connectDB = require("../db");
const getAssetBalance = require("../utils/updateRRCBalance");
const objects = require("../utils/DTO.json");
const { fetchAccountHistory } = require("../utils/accountHistory");

connectDB();

const getPaginatedAccounts = async (page, limit) => {
  const skip = (page - 1) * limit;
  const accounts = await Account.find()
    .sort({ balance: -1 })
    .skip(skip)
    .limit(limit);

  const pagAccountObject = {
    page,
    count: await Account.countDocuments(),
    accounts,
  };

  return pagAccountObject;
};

const updateAccountDetail = async (accountsIden) => {
  const balanceObj = await getAssetBalance(accountsIden);
  let accountObject = [];
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
      balance: balanceObj.balance,
      creation_time: new Date(accounts[i].creation_time),
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

const updateAccountEntry = async (accountsIden, limit) => {
  if (/^(BTS|RRC)[0-9A-Za-z]{50,55}$/.test(accountsIden)) {
    // if (/^[1-9A-HJ-NP-Za-km-z1-9]{1,55}$/.test(accountsIden)) {
    let keyRef = await Apis.instance()
      .db_api()
      .exec("get_key_references", [[accountsIden]]);
    accountsIden = keyRef[0][0];
  }

  let accountObject = await updateAccountDetail(accountsIden);
  const historyObj = await fetchAccountHistory(accountsIden, limit);

  return {
    account: accountObject[0],
    history: historyObj.history,
  };
};

module.exports = {
  updateAccountEntry,
  updateAccountDetail,
  getPaginatedAccounts,
};
