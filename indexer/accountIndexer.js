const { Apis } = require("bitsharesjs-ws");
const connect = require("../connectNode");
const getAssetBalance = require("../utils/updateRRCBalance");
const Account = require("../models/Account");
const accountController = require("../routes/accountController");
const connectDB = require("../db");

connectDB();

async function getAllAccountNames() {
  const accountNames = [];
  const limit = 1000;

  const prefixes = "abcdefghijklmnopqrstuvwxyz".split("");

  for (let prefix of prefixes) {
    let accName = "";
    let accID = "";

    do {
      accounts = await Apis.instance()
        .db_api()
        .exec("lookup_accounts", [prefix + accName, limit]);
      if (accounts.length > 0) {
        for (let accNum = 0; accNum < accounts.length; accNum++) {
          accID = accounts[accNum][1]; // Set start to last account name received
          const existingAccount = await Account.findOne({
            account_id: accID,
          });
          if (!existingAccount) {
            await accountController.updateAccountDetail(accID);
          } else {
            await getAssetBalance(accID);
          }

          console.log(
            `${accNum}: ${JSON.stringify(accounts[accNum])} updated in DB, `
          );
        }
      }
    } while (accounts.length === limit);
  }

  return accountNames;
}

(async () => {
  try {
    await connect();
    await getAllAccountNames();
  } catch (error) {
    console.error("Error:", error);
  }
})();
