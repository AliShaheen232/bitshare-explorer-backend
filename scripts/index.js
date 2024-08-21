require("dotenv").config();
const WebSocket = require("ws");
const url = require("url");
const initializeWebSocket = require("../connectNode");
const txCount = require("./perDayTxCount");
const witnesses = require("./witnessAndVotes");
const topHolders = require("./topHolders");

const port = process.env.SCRIPT_PORT || 5000;
const wss = new WebSocket.Server({ port });

wss.on("connection", async (ws, req) => {
  let pathName = url.parse(req.url);
  pathName = pathName.path;

  console.log("Client connected");

  switch (pathName) {
    case "/witnesses":
      runWitnessesScript(ws);
      break;
    case "/txCount":
      runTXCount(ws);
    case "/topHolders":
      runTopHolders(ws);
      break;

    default:
      ws.send(JSON.stringify({ error: "Unknown path" }));
      break;
  }

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const runWitnessesScript = async (ws) => {
  await initializeWebSocket();

  setInterval(async () => {
    ws.send(JSON.stringify({ task: "witnesses", data: await witnesses() }));
  }, 3000);
};

const runTXCount = async (ws) => {
  setInterval(async () => {
    ws.send(JSON.stringify({ task: "perDayTxCount", data: await txCount() }));
  }, 3000);
};

const runTopHolders = async (ws) => {
  setInterval(async () => {
    ws.send(
      JSON.stringify({ task: "topRRCHolders", data: await topHolders() })
    );
  }, 3000);
};

console.log(`WebSocket server is running on ws://localhost:${port}`);
