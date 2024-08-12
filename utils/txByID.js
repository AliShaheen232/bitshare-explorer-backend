const initializeWebSocket = require("../connectNode");
const { Apis } = require("bitsharesjs-ws");
const getPublicKey = require("./getPublicKey");
const apiHelper = require("../routes/apiHelper");

const getObjectDetails = async (objectId) => {
  try {
    // await initializeWebSocket();

    let object = await Apis.instance()
      .db_api()
      .exec("get_objects", [[objectId]]);

    object = await parseObjectDetails(object[0]);
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
  object.op[1].fee.asset_id =
    (await apiHelper.fetchAssetByName(object.op[1].fee.asset_id)).symbol ||
    object.op[1].fee.asset_id;

  let from = (await getPublicKey(object.op[1].from)) || object.op[1].from;
  let to = (await getPublicKey(object.op[1].to)) || object.op[1].to;

  const obj = {
    amount: object.op[1].amount,
    fee: object.op[1].fee,
    amount_to_reserve: object.op[1].amount_to_reserve,
    memo: object.op[1].memo,
    block_num: object.block_num,
    block_time: object.block_time,
  };

  if (object.op[0] == 15) {
    object.op[1].amount_to_reserve.asset_id =
      (
        await apiHelper.fetchAssetByName(
          object.op[1].amount_to_reserve.asset_id
        )
      ).symbol || object.op[1].amount_to_reserve.asset_id;

    let payer = object.op[1].payer;
    payer = await getPublicKey(payer);

    return { operation_type: object.op[0], id: object.id, payer, ...obj };
  } else {
    object.op[1].amount.asset_id =
      (await apiHelper.fetchAssetByName(object.op[1].amount.asset_id)).symbol ||
      object.op[1].amount.asset_id;
    return {
      operation_type: object.op[0],
      id: object.id,
      from,
      to,
      ...obj,
    };
  }
};
module.exports = getObjectDetails;
