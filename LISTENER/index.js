require("dotenv").config();

const ws = require("ws");
const { parse } = require("url");
const express = require("express");

const configureDB = require("./config/database");
const Message = require("./config/models/Message");
const { decryptAndValidateData, upsert } = require("./utils");

(async () => {
  const app = express();
  configureDB();

  const wsServer1 = new ws.WebSocketServer({ noServer: true });
  const wsServer2 = new ws.WebSocketServer({ noServer: true });

  let downStreamData = {};
  let clientSocketInstance = null;

  wsServer1.on("connection", (socket) => {
    socket.on("message", async (message) => {
      const messageArray = message.toString().split("|");
      const time = new Date(new Date().toUTCString());

      try {
        const { decryptArray, failureRate } = await decryptAndValidateData(
          messageArray,
          time
        );

        const upsertRes = await upsert(Message, decryptArray, time);

        downStreamData = {
          successRateDecoding: `${100 - failureRate}%`,
          timeUTC: time,
          upsertRes,
        };

        clientSocketInstance &&
          clientSocketInstance.send(JSON.stringify(downStreamData));
      } catch (err) {
        console.log(err);
      }
    });
  });

  wsServer2.on("connection", (socket) => {
    clientSocketInstance = socket;
  });

  // Node.js HTTP server, so use
  const server = app.listen(3001);
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url);

    if (pathname === "/push") {
      wsServer1.handleUpgrade(request, socket, head, (socket) => {
        wsServer1.emit("connection", socket, request);
      });
    } else if (pathname === "/pull") {
      wsServer2.handleUpgrade(request, socket, head, function done(ws) {
        wsServer2.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });
})();
