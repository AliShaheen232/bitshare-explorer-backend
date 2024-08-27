const Account = require("../models/Account");
const connectDB = require("../db");

connectDB();

const fetchAssetHolders = async () => {
  try {
    let topHolders = [];
    const holders = await Account.find().sort({ balance: -1 }).limit(20);
    holders.map((holder) => {
      topHolders.push({
        account_id: holder.account_id,
        public_key: holder.public_key,
        name: holder.name,
        balance: holder.balance,
        creation_time: holder.creation_time,
      });
    });
    return topHolders;
  } catch (error) {
    console.error(`Error fetching asset holders: ${error.message}`);
    throw error;
  }
};

// fetchAssetHolders();
module.exports = fetchAssetHolders;
