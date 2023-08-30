import React, { useState, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

export const WebSocketDemo = () => {
  //Public API that will echo messages sent to it back to the client
  const [socketUrl, setSocketUrl] = useState("ws://localhost:3001/pull");
  const messageHistory = useRef([]);

  const { readyState } = useWebSocket(socketUrl, {
    onMessage: (event) => {
      messageHistory.current = messageHistory.current.concat(event.data);
    },
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <div>
      <div>
        <span style={{ color: "green" }}>
          The WebSocket is currently {connectionStatus}
        </span>
      </div>

      <div>
        <table>
          <tr>
            <th>UTC TIME</th>
            <th>{"SUCCESS RATE DECODING (%)"}</th>
            <th>DATA</th>
          </tr>
          {messageHistory.current.map((message, idx) => (
            <tr
              style={
                idx % 2 === 0
                  ? { color: "red", height: "20px" }
                  : { color: "blue", height: "20px" }
              }
              key={idx}
            >
              {console.log(message)}
              <td>{message ? JSON.parse(message).timeUTC : null}</td>
              <td>
                {message ? JSON.parse(message).successRateDecoding : null}
              </td>
              <td style={{ overflowX: "scroll" }}>
                <div style={{ height: "100px", overflowY: "scroll" }}>
                  {message
                    ? JSON.stringify(JSON.parse(message).upsertRes)
                    : null}
                </div>
              </td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
};

function App() {
  return <WebSocketDemo />;
}

export default App;
