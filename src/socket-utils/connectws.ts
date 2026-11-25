import { Client, type IMessage } from "@stomp/stompjs";

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
  const client = new Client({
    webSocketFactory: () => new WebSocket(WS_BASE_URL),
    reconnectDelay: 4000,
    onConnect: () => {
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
