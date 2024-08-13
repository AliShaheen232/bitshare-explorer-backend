const fs = require("fs");
const path = require("path");

const lastNumber = path.join("./", "lastNumber.json");

const writeToFile = (blockNumber) => {
  try {
    const data = { blockNumber };
    fs.writeFileSync(lastNumber, JSON.stringify(data));
  } catch (err) {
    throw err;
  }
};
const readFromFile = () => {
  try {
    let data = fs.readFileSync(lastNumber, "utf8");
    return JSON.parse(data).blockNumber || 0;
  } catch (err) {
    throw err;
  }
};

module.exports = { writeToFile, readFromFile };
