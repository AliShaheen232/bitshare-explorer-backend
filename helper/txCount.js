const Transaction = require("../models/Transaction");
const connectDB = require("../db");
connectDB();
const getTransactionCounts = async (diff) => {
  let endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - diff);
  console.log("🚀 ~ getTransactionCounts ~ diff:", diff);

  let count = 0;

  if (!(startDate instanceof Date)) {
    startDate = new Date(startDate);
  }

  count = await Transaction.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%U", // Group by day
            date: "$timestamp",
          },
        },
        count: { $sum: 1 }, // Count the number of transactions
      },
    },
    {
      $sort: { _id: 1 }, // Sort by date ascending
    },
  ]);
  // Use a cursor to iterate over each document in the collection
  // const cursor = Transaction.find({}).cursor();

  // // Iterate over each document
  // for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
  //   // Check if the timestamp is greater than or equal to startDate
  //   const docTimestamp = new Date(doc.timestamp);
  //   if (docTimestamp >= startDate) {
  //     count++;
  //   }
  // }
  console.log("🚀 ~ getTransactionCounts ~ count:", count);
  return count;
};
getTransactionCounts(1);
getTransactionCounts(7);
getTransactionCounts(14);
getTransactionCounts(30);
getTransactionCounts(31);
// module.exports = getTransactionCounts;
