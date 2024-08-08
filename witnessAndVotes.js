require("dotenv").config();
const WebSocket = require("ws");
const { ChainStore, FetchChain } = require("bitsharesjs");
const { Apis } = require("bitsharesjs-ws");
const connectToNode = require("./connectNode");

const port = process.env.WITNESS_PORT || 4000;
const wss = new WebSocket.Server({ port });

const getWitnessesAndVotes = async () => {
  try {
    ChainStore.init(false);
    const globalProps = await Apis.instance()
      .db_api()
      .exec("get_global_properties", []);
    const activeWitnesses = globalProps.active_witnesses;

    const witnesses = await Apis.instance()
      .db_api()
      .exec("get_witnesses", [activeWitnesses]);
    const witnessData = await Promise.all(
      witnesses.map(async (witness) => {
        const account = await FetchChain("getAccount", witness.witness_account);
        const lastBlock = await Apis.instance()
          .db_api()
          .exec("get_block", [witness.last_confirmed_block_num]);

        let transactions = [];
        if (lastBlock && lastBlock.transactions) {
          transactions = lastBlock.transactions.map((tx) => ({
            ref_block_num: tx.ref_block_num,
            ref_block_prefix: tx.ref_block_prefix,
            expiration: tx.expiration,
            operations: tx.operations,
            extensions: tx.extensions,
            signatures: tx.signatures,
          }));
        }

        return {
          id: witness.id,
          account: account.get("name"),
          votes: witness.total_votes,
          last_block_num: witness.last_confirmed_block_num,
          transactions: transactions,
        };
      })
    );

    const witness = JSON.stringify(witnessData, null, 2);
    console.log("Witnesses and their votes:", witness);
    return witness;
  } catch (error) {
    console.error("Error fetching witnesses and their votes:", error);
  }
};

wss.on("connection", async (ws) => {
  await connectToNode();

  console.log("Client connected");

  setInterval(async () => {
    const data = await getWitnessesAndVotes();
    ws.send(JSON.stringify(data));
  }, 3000);

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);
