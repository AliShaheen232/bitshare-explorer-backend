const { Apis } = require("bitsharesjs-ws");
const initializeWebSocket = require("../connectNode");
const apiHelper = require("../routes/apiHelper");
const Account = require("../models/Account");

async function connect() {
  await initializeWebSocket();
}

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
          if (!existingAccount) await apiHelper.updateAccountDetail(accID);

          console.log(
            `${accNum}: ${JSON.stringify(accounts[accNum])} updated in DB, `
          );
        }
      }
    } while (accounts.length === limit);
  }

  return accountNames;
}

// Main function to run the script
(async () => {
  try {
    await connect();
    const accountNames = await getAllAccountNames();
  } catch (error) {
    console.error("Error:", error);
  }
})();
