const { Apis } = require("bitsharesjs-ws");
const Account = require("../models/Account");

const getPublicKey = async (accountID) => {
  try {
    const existingAccount = await Account.findOne({
      account_id: accountID,
    });

    if (existingAccount) {
      return existingAccount.public_key;
    } else {
      const accounts = await Apis.instance()
        .db_api()
        .exec("get_accounts", [[accountID]]);
      let account = Array.isArray(accounts) ? accounts[0] : null;
      return account !== null ? account.owner.key_auths[0][0] : null;
    }
  } catch (error) {
    console.error("Error fetching public key:", error);
    throw error;
  }
};

module.exports = getPublicKey;
