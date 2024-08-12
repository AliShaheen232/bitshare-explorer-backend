const Transaction = require("../models/Transaction");
const connectDB = require("../db");
const objects = require("../utils/DTO.json");

connectDB();

const getTransactionCounts = async (diff) => {
  let endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - diff);

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
            format: "%Y-%U",
            date: "$timestamp",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  return count[0].count;
};

const transactionsCountStatus = async () => {
  let days = [1, 7, 14, 30, 31];
  let data = new Array(5);

  for (let i = 0; i < days.length; i++) {
    const count = await getTransactionCounts(days[i]);
    data[i] = { days: days[i], count };
  }

  return { timestamp: new Date(), data };
};
module.exports = transactionsCountStatus;
