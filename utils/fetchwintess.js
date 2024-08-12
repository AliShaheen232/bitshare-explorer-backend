const { Apis } = require("bitsharesjs-ws");
const { ChainStore } = require("bitsharesjs");

async function getWitnessInfo() {
  // Connect to the BitShares WebSocket API
  await Apis.instance("wss://dex.iobanker.com/ws", true).init_promise;

  // Fetch all witness IDs
  const globalProperties = await Apis.instance()
    .db_api()
    .exec("get_global_properties", []);
  const witnessIds = globalProperties.active_witnesses;

  const witnessInfoPromises = witnessIds.map(async (witnessId) => {
    // Fetch witness details
    const witness = await Apis.instance()
      .db_api()
      .exec("get_witnesses", [[witnessId]]);
    const witnessAccount = await Apis.instance()
      .db_api()
      .exec("get_accounts", [[witness[0].witness_account]]);

    const witnessData = {
      witness_account_name: witnessAccount[0].name,
      witness_id: witness[0].id,
      last_confirmed_block_num: witness[0].last_confirmed_block_num,
    };

    // Fetch last produced block details
    if (witnessData.last_confirmed_block_num) {
      try {
        const block = await Apis.instance()
          .db_api()
          .exec("get_block", [witnessData.last_confirmed_block_num]);
        witnessData.last_block = {
          block_num: witnessData.last_confirmed_block_num,
          timestamp: block.timestamp,
          transaction_count: block.transactions.length,
        };
      } catch (error) {
        witnessData.last_block = { error: error.message };
      }
    }

    return witnessData;
  });

  const witnessInfo = await Promise.all(witnessInfoPromises);
  return witnessInfo;
}

// Get witness information and print it
getWitnessInfo()
  .then((witnessInfo) => {
    witnessInfo.forEach((info) => {
      console.log(
        `Witness: ${info.witness_account_name} (ID: ${info.witness_id})`
      );
      if (info.last_block) {
        if (info.last_block.error) {
          console.log(`  Error fetching last block: ${info.last_block.error}`);
        } else {
          console.log(`  Last Produced Block: ${info.last_block.block_num}`);
          console.log(`  Timestamp: ${info.last_block.timestamp}`);
          console.log(
            `  Transaction Count: ${info.last_block.transaction_count}`
          );
        }
      }
      console.log();
    });
  })
  .catch((error) => {
    console.error("Error fetching witness information:", error);
  });
