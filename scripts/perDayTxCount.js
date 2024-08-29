const Transaction = require("../models/Transaction");
const connectDB = require("../db");
const objects = require("../utils/DTO.json");

// connectDB();

const getTransactionCounts = async (diff) => {
  let endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (diff + 1));
  endDate.setDate(endDate.getDate() - diff);

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
        _id: null,
        count: { $sum: 1 },
      },
    },
  ]);

  if (count.length > 0) {
    return { endDate, count: count[0].count };
  } else {
    return { endDate, count: 0 };
  }
};

const transactionsCountStatus = async () => {
  let data = new Array(14);
  let endDate;

  for (let i = 0; i < 14; i++) {
    const countObj = await getTransactionCounts(i);
    endDate = new Date(countObj.endDate).toLocaleDateString();
    data[i] = { date: endDate, count: countObj.count };
  }
  const twoWeeksStat = { timestamp: new Date(), data };
  return twoWeeksStat;
};

module.exports = transactionsCountStatus;
