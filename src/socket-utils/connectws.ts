// import { Client, type IMessage } from "@stomp/stompjs";

// const WS_URL = import.meta.env.VITE_WS_BASE_URL ?? "wss://10.67.0.73:8443/ws";

// export const createStompClient = (
//   onMessage: (msg: IMessage) => void,
//   onConnect: () => void,
//   onError: (err: string) => void,
// ) => {
//   console.log("ws-url: ", WS_URL);
//   const client = new Client({
//     // Используем нативный WebSocket, как требует ТЗ
//     webSocketFactory: () => new WebSocket(WS_URL),
//     reconnectDelay: 4000,
//     debug: (str) => console.log(str),
//     onConnect: () => {
//       console.log("STOMP connected");
//       onConnect();
//     },
//     onStompError: (frame) => {
//       onError(frame.headers["message"] || "STOMP error");
//     },
//     onWebSocketError: (event) => {
//       onError("WebSocket error");
//     },
//   });
//   console.log("Client created");
//   client.activate();
//   console.log("Client activated");

//   client.onConnect = () => {
//     client.subscribe("/user/queue/messages", (msg) => onMessage(msg));
//     client.subscribe("/user/queue/events", (msg) => onMessage(msg));
//     onConnect();
//   };

//   return client;
// };

import { Client, type IMessage } from "@stomp/stompjs";

// Браузер подключается к WebSocket бэкенда напрямую
const WS_URL = import.meta.env.VITE_WS_BASE_URL || "wss://10.67.0.73:8443/ws";

export const createStompClient = (
  onMessage: (msg: IMessage) => void,
  onConnect: () => void,
  onError: (err: string) => void,
) => {
  console.log("ws-url: ", WS_URL);
  const client = new Client({
    // Используем нативный WebSocket, как требует ТЗ
    webSocketFactory: () => new WebSocket(WS_URL),
    reconnectDelay: 4000,
    debug: (str) => console.log(str),
    onConnect: () => {
      console.log("STOMP connected");
      onConnect();
    },
    onStompError: (frame) => {
      onError(frame.headers["message"] || "STOMP error");
    },
    onWebSocketError: (event) => {
      onError("WebSocket error");
    },
  });
  console.log("Client created");
  client.activate();
  console.log("Client activated");

  client.onConnect = () => {
    client.subscribe("/user/queue/messages", (msg) => onMessage(msg));
    client.subscribe("/user/queue/events", (msg) => onMessage(msg));
    onConnect();
  };

  return client;
};
