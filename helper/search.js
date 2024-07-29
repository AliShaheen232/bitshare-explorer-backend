function searchInput(input) {
  input = input.trim();

  if (/^\d+$/.test(input)) {
    return "blockNumber";
  }

  if (/^[0-9a-fA-F]{40}$/.test(input)) {
    return "transactionHash";
  }

  if (/^[1-9]+\.\d+\.\d+$/.test(input)) {
    return "accountID";
  }

  return null;
}
