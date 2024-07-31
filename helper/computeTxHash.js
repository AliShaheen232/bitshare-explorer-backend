const { ops } = require("bitsharesjs");
const crypto = require("crypto");

// Function to convert public keys to the correct prefix
const convertPublicKey = (key) => {
  if (key.startsWith("BTS")) {
    return key.replace("BTS", "CBA");
  }
  return key;
};

// Function to recursively convert all public keys in the data
const convertKeys = (data) => {
  if (typeof data === "object" && data !== null) {
    for (const key in data) {
      if (typeof data[key] === "string" && data[key].startsWith("BTS")) {
        data[key] = convertPublicKey(data[key]);
      } else if (typeof data[key] === "object") {
        convertKeys(data[key]);
      }
    }
  }
};

// Function to sanitize extensions
const sanitizeExtensions = (extensions) => {
  if (!Array.isArray(extensions)) {
    return [];
  }
  return extensions.map((extension) => {
    if (extension === undefined || extension === null) {
      return [];
    }
    return extension;
  });
};

// Function to compute the transaction ID (hash) with 40-character length
const computeTxHash = (transaction) => {
  // Adjust the transaction to have the correct public key format and sanitize extensions
  transaction.operations.forEach((operation) => {
    convertKeys(operation[1]);
    if (operation[1].extensions) {
      operation[1].extensions = sanitizeExtensions(operation[1].extensions);
    }
  });

  // Serialize the transaction
  const trBuffer = ops.transaction.toBuffer(transaction);
  const hash = crypto.createHash("sha256").update(trBuffer).digest("hex");

  // Truncate to get a 40-character string
  const txHash = hash.slice(0, 40);
  console.log("🚀 ~ computeTxHash ~ txHash:", txHash);
  return txHash;
};

module.exports = computeTxHash;
