const Transaction = require("../models/Transaction");
const connectDB = require("../db");
const objects = require("../utils/DTO.json");

// connectDB();

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
        _id: null, // No need to group by date
        count: { $sum: 1 },
      },
    },
  ]);

  if (count.length > 0) {
    return count[0].count;
  } else {
    return 0;
  }
};

const lessThenMonth = async () => {
  let endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  let count = 0;

  if (!(startDate instanceof Date)) {
    startDate = new Date(startDate);
  }
  const oldestTX = (await Transaction.find().sort({ timestamp: 1 }).limit(1))[0]
    .timestamp;
  const latestTX = (
    await Transaction.find().sort({ timestamp: -1 }).limit(1)
  )[0].timestamp;

  count = await Transaction.aggregate([
    {
      $match: {
        timestamp: {
          $gte: oldestTX,
          $lt: startDate,
        },
      },
    },
    {
      $group: {
        _id: null, // No need to group by date
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  if (count.length > 0) {
    return count[0].count;
  } else {
    return 0;
  }
};

const transactionsCountStatus = async () => {
  let days = [1, 7, 14, 30];
  let data = new Array(5);

  for (let i = 0; i < days.length; i++) {
    const count = await getTransactionCounts(days[i]);
    data[i] = { days: days[i], count };
  }
  const monthCount = await lessThenMonth();
  data[data.length - 1] = { days: 31, monthCount };

  return { timestamp: new Date(), data };
};
module.exports = transactionsCountStatus;
