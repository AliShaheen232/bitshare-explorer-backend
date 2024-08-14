const { Apis } = require("bitsharesjs-ws");
const Account = require("../models/Account");

const getPublicKey = async (accountID) => {
  console.log("🚀 ~ getPublicKey ~ accountID:", accountID);
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
      console.log("🚀 ~ getPublicKey ~ accounts:", accounts);
      let account = Array.isArray(accounts) ? accounts[0] : null;
      if (account !== null && account.owner.key_auths.length > 0) {
        account.owner.key_auths[0][0] ? account.owner.key_auths[0][0] : null;
        return account.owner.key_auths[0][0];
      }
      return null;
    }
  } catch (error) {
    console.error("Error fetching public key:", error);
    throw error;
  }
};

module.exports = getPublicKey;
