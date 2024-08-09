const initializeWebSocket = require("../connectNode");
const { Apis } = require("bitsharesjs-ws");
const getPublicKey = require("./getPublicKey");

const getObjectDetails = async (objectId) => {
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
};

const parseObjectDetails = async (object) => {
  if (!object) {
    console.log("Object not found.");
    return;
  }
  let from = (await getPublicKey(object.op[1].from)) || object.op[1].from;
  let to = (await getPublicKey(object.op[1].to)) || object.op[1].to;

  return {
    id: object.id,
    from,
    to,
    amount: object.op[1].amount,
    fee: object.op[1].fee,
    memo: object.op[1].memo,
    block_num: object.block_num,
    block_time: object.block_time,
  };
};
module.exports = getObjectDetails;
// getObjectDetails(objectId)
//   .then((details) => {
//     parseObjectDetails(details);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
