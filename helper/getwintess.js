const { ChainStore, FetchChain } = require("bitsharesjs");
const { Apis } = require("bitsharesjs-ws");
const connectToNode = require("../connectNode");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "witness.json");

const getWitnessesAndVotes = async () => {
  try {
    // Connect to the BitShares node

    // Initialize ChainStore
    ChainStore.init(false); // Disable subscription to universal object creation and removal

    // Fetch the list of witnesses
    const globalProps = await Apis.instance()
      .db_api()
      .exec("get_global_properties", []);
    const activeWitnesses = globalProps.active_witnesses;
    console.log(
      "🚀 ~ getWitnessesAndVotes ~ activeWitnesses:",
      activeWitnesses
    );

    // Fetch the witness details
    const witnesses = await Apis.instance()
      .db_api()
      .exec("get_witnesses", [activeWitnesses]);
    console.log("🚀 ~ getWitnessesAndVotes ~ witnesses:", witnesses);

    // Fetch witness votes and the latest block each witness produced
    // const witnessData = await Promise.all(
    //   witnesses.map(async (witness) => {
    //     const account = await FetchChain("getAccount", witness.witness_account);
    //     const lastBlock = await Apis.instance()
    //       .db_api()
    //       .exec("get_block", [witness.last_confirmed_block_num]);

    //     let transactions = [];
    //     if (lastBlock && lastBlock.transactions) {
    //       transactions = lastBlock.transactions.map((tx) => ({
    //         ref_block_num: tx.ref_block_num,
    //         ref_block_prefix: tx.ref_block_prefix,
    //         expiration: tx.expiration,
    //         operations: tx.operations,
    //         extensions: tx.extensions,
    //         signatures: tx.signatures,
    //       }));
    //     }

    //     return {
    //       id: witness.id,
    //       account: account.get("name"),
    //       votes: witness.total_votes,
    //       last_block_num: witness.last_confirmed_block_num,
    //       transactions: transactions,
    //     };
    //   })
    // );

    // const witness = JSON.stringify(witnessData, null, 2);
    // console.log("Witnesses and their votes:", witness);
    // fs.appendFileSync(logFile, witness);
  } catch (error) {
    console.error("Error fetching witnesses and their votes:", error);
  }
};

// Function to start polling every 3 seconds
const startPolling = async () => {
  await connectToNode();
  getWitnessesAndVotes(); // Initial call
  console.log("\n\n----\n\n new witness");
  // Poll every 3 seconds
  // setInterval(getWitnessesAndVotes, 6000);
};

// Start the polling
startPolling();
