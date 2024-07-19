const mongoose = require("mongoose");
const Block = require("../models/Block"); // Assuming you have a Block model defined
const Transaction = require("../models/Transaction"); // Assuming you have a Transaction model defined
const {
  updateBlockEntry,
  updateTransactionEntry,
} = require("../helper/apiHelper");

// mongoose.connect("mongodb://localhost:27017/blockchain", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// mongoose.connection.once("open", () => {
//   console.log("Connected to MongoDB");
// });

consumer.on("message", async (message) => {
  try {
    const data = JSON.parse(message.value);
    if (message.topic === "blocks") {
      await updateBlockEntry(data);
    } else if (message.topic === "transactions") {
      await updateTransactionEntry(data);
    }
    console.log(`Message consumed from topic ${message.topic}`);
  } catch (error) {
    console.error("Error processing message", error);
  }
});

consumer.on("error", (err) => {
  console.error("Error in Kafka Consumer", err);
});

//   "block": {
//     "blockNumber": 0,
//     "previous": "",
//     "witness": "",
//     "witness_signature": "",
//     "transaction_merkle_root": "",
//     "transaction_count": 0,
//     "timestamp": ""
//   },
