import { Client, type IMessage } from "@stomp/stompjs";

// Браузер подключается к WebSocket бэкенда напрямую
const serverName =
  import.meta.env.VITE_SERVER_NAME &&
  import.meta.env.VITE_SERVER_NAME !== "localhost"
    ? import.meta.env.VITE_SERVER_NAME
    : window.location.hostname;

export const WS_BASE_URL = `wss://${serverName}:8443/ws`;

export const createStompClient = (
  onMessage: (msg: IMessage) => void,
  onConnect: () => void,
  onError: (err: string) => void,
) => {
  console.log("ws-url: ", WS_BASE_URL);
  const client = new Client({
    webSocketFactory: () => new WebSocket(WS_BASE_URL),
    reconnectDelay: 4000,
    debug: (str) => console.log(str),
    onConnect: () => {
      console.log("STOMP connected");
      client.subscribe("/user/queue/messages", (msg) => onMessage(msg));
      client.subscribe("/user/queue/events", (msg) => onMessage(msg));
      onConnect();
    },
    onStompError: (frame) => onError(frame.headers["message"] || "STOMP error"),
    onWebSocketError: () => onError("WebSocket error"),
  });

  client.activate();
  return client;
};
