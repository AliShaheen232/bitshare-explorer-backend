const replaceBTSWithRR = (obj) => {
  if (typeof obj === "string") {
    return obj.replace(/BTS/g, "RRC");
  } else if (Array.isArray(obj)) {
    return obj.map(replaceBTSWithRR);
  } else if (typeof obj === "object" && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = replaceBTSWithRR(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

module.exports = {
  replaceBTSWithRR,
};
