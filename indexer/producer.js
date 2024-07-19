require("dotenv").config();
const { Apis } = require("bitsharesjs-ws");
const kafka = require("kafka-node");
const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new Producer(client);
const { heighestBlock } = require("./heighestBlock");

producer.on("ready", () => {
  console.log("Kafka Producer is connected and ready.");
});

producer.on("error", (error) => {
  console.error("Error in Kafka Producer", error);
});

const produce = async (blockNumber) => {
  const block = await Apis.instance().db_api().exec("get_block", [blockNumber]);
  const payloads = [
    {
      topic: "blocks",
      messages: JSON.stringify({ blockNumber, ...block }),
    },
  ];

  producer.send(payloads, (err, data) => {
    if (err) console.error("Error sending block to Kafka", err);
    else console.log("Block sent to Kafka", data);
  });
};

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const latestBlock = async () => {
  const blockchain = await Apis.instance()
    .db_api()
    .exec("get_dynamic_global_properties", []);
  return blockchain.head_block_number;
};

const produceMessages = async () => {
  const wsNode = process.env.WEBSOCKET_URL;
  await Apis.instance(wsNode, true).init_promise;

  let headBlockNumber = await latestBlock();
  let _heighestBlock = await heighestBlock();
  console.log(
    "🚀 ~ produceMessages ~ _heighestBlock:",
    headBlockNumber,
    _heighestBlock,
    headBlockNumber - _heighestBlock
  );

  for (_heighestBlock; _heighestBlock <= headBlockNumber; _heighestBlock++) {
    await produce(_heighestBlock);
    await delay(0);
  }
  console.log("loop ends");

  let lastBlockNumber = 0;
  setInterval(async () => {
    let currentBlockNumber = await latestBlock();
    if (currentBlockNumber > lastBlockNumber) {
      await produce(currentBlockNumber);
      lastBlockNumber = currentBlockNumber;
    } else {
      console.log("No New Block", currentBlockNumber);
    }
  }, 1000);
};

produceMessages();
