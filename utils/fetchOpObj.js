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
  const assetPrecision = 6;
  let operation_type = object.op[0];
  let operation_data = object.op[1];
  if (!object) {
    console.log("Object not found.");
    return;
  }

  if ("fee" in operation_data) {
    operation_data.fee.asset_id =
      operation_data.fee.asset_id === "1.3.0"
        ? "BTS"
        : operation_data.fee.asset_id;
  }

  if ("amount" in operation_data) {
    operation_data.amount.asset_id =
      operation_data.amount.asset_id === "1.3.1"
        ? "RRC"
        : operation_data.amount.asset_id;
    operation_data.amount.amount =
      operation_data.amount.amount / Math.pow(10, assetPrecision);
  }

  if ("asset_to_issue" in operation_data) {
    operation_data.asset_to_issue.asset_id =
      operation_data.asset_to_issue.asset_id === "1.3.1"
        ? "RRC"
        : operation_data.asset_to_issue.asset_id;
    operation_data.asset_to_issue.amount =
      operation_data.asset_to_issue.amount / Math.pow(10, assetPrecision);
  }

  if ("amount_to_reserve" in operation_data) {
    operation_data.amount_to_reserve.asset_id =
      operation_data.amount_to_reserve.asset_id === "1.3.1"
        ? "RRC"
        : operation_data.amount_to_reserve.asset_id;
    operation_data.amount_to_reserve.amount =
      operation_data.amount_to_reserve.amount / Math.pow(10, assetPrecision);
  }

  if ("issuer" in operation_data) {
    operation_data.issuer =
      (await getPublicKey(operation_data.issuer)) || operation_data.issuer;
    operation_data.issue_to_account =
      (await getPublicKey(operation_data.issue_to_account)) ||
      operation_data.issue_to_account;
  }

  if ("from" in operation_data) {
    operation_data.from =
      (await getPublicKey(operation_data.from)) || operation_data.from;
    operation_data.to =
      (await getPublicKey(operation_data.to)) || operation_data.to;
  }

  if ("payer" in operation_data) {
    operation_data.payer =
      (await getPublicKey(operation_data.payer)) || operation_data.payer;
  }

  const obj = {
    operation_data,
    block_num: object.block_num,
    block_time: object.block_time,
  };

  return {
    id: object.id,
    operation_type,
    ...obj,
  };
};
module.exports = { getObjectDetails, parseObjectDetails };
