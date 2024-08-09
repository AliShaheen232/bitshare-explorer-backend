const initializeWebSocket = require("../connectNode");
const { Apis } = require("bitsharesjs-ws");

async function getObjectDetails(objectId) {
  try {
    // await initializeWebSocket();

    let object = await Apis.instance()
      .db_api()
      .exec("get_objects", [[objectId]]);

    object = parseObjectDetails(object[0]);
    return object;
  } catch (error) {
    console.error("Error fetching object details:", error);
    throw error;
  }
}

function parseObjectDetails(object) {
  if (!object) {
    console.log("Object not found.");
    return;
  }

  return {
    id: object.id,
    from: object.op[1].from,
    to: object.op[1].to,
    amount: object.op[1].amount,
    fee: object.op[1].fee,
    memo: object.op[1].memo,
    block_num: object.block_num,
    block_time: object.block_time,
  };
}
module.exports = getObjectDetails;
// getObjectDetails(objectId)
//   .then((details) => {
//     parseObjectDetails(details);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
