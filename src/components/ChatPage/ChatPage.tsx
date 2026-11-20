// import styles from "./ChatPage.module.css";
// import { useEffect, useRef, useState } from "react";
// import { SquareUserRound, CircleUserRound, SendHorizonal } from "lucide-react";
// import ChatScroll from "@components/ChatScroll";
// import { createStompClient } from "@/socket-utils/connectws";
// import type { Client, IMessage } from "@stomp/stompjs";
// import { useMe } from "@/rest-queries/hooks";
// import { useMessages } from "@rest-queries/hooks";
// import type { Message } from "@rest-queries/types";
// import { useQueryClient } from "@tanstack/react-query";

// const MIN_WIDTH = 100;
// const MAX_WIDTH = 800;
// const DEFAULT_WIDTH = 270;

// const ChatPage = () => {
//   const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
//   const [selectedChatTitle, setSelectedChatTitle] = useState<string>("");

//   const handleSend = () => {
//     if (!selectedChatId || !messageText.trim() || !clientRef.current) return;

//     const payload = {
//       chatId: selectedChatId,
//       content: messageText.trim(),
//       clientMessageId: crypto.randomUUID(),
//     };

//     clientRef.current.publish({
//       destination: "/app/chat.send",
//       body: JSON.stringify(payload),
//     });

//     setMessageText("");
//   };

//   const {
//     data: messages,
//     isLoading: isLoadingMessages,
//     isError: isErrorMessages,
//   } = useMessages(selectedChatId);

//   const flatMessages: Message[] =
//     messages?.pages.flatMap((page) => {
//       if (Array.isArray(page)) return page; // если страница — массив
//       return page.content ?? []; // если страница — объект Spring
//     }) ?? [];

//   const handleSelectChat = (chatId: number, title: string) => {
//     setSelectedChatId(chatId);
//     setSelectedChatTitle(title);
//   };

//   const { data: me, isLoading: isLoadingMe, isError: isErrorMe } = useMe();

//   const clientRef = useRef<Client | null>(null);
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     if (!me) return;

//     console.log("ChatPage mounted");

//     const client = createStompClient(
//       (msg: IMessage) => {
//         const data = JSON.parse(msg.body);
//         queryClient.invalidateQueries({ queryKey: ["messages", data.chatId] });
//         queryClient.invalidateQueries({ queryKey: ["chats"] });
//       },
//       () => console.log("Соединение установлено"),
//       (err: string) => console.error("Ошибка STOMP:", err),
//     );

//     clientRef.current = client;

//     return () => {
//       console.log(
//         "ChatPage unmounting. НЕ отключаем глобальный клиент, чтобы не рвать соединение при Strict Mode.",
//       );
//     };
//   }, []);

//   const [messageText, setMessageText] = useState<string>("");
//   const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
//     if (typeof window === "undefined") return DEFAULT_WIDTH;
//     const saved = Number(localStorage.getItem("sidebarWidth"));
//     return Number.isFinite(saved) && saved > 0
//       ? Math.min(Math.max(saved, MIN_WIDTH), MAX_WIDTH)
//       : DEFAULT_WIDTH;
//   });
//   const [dragging, setDragging] = useState(false);
//   const resizerRef = useRef<HTMLDivElement>(null);
//   const startX = useRef(0);
//   const startWidth = useRef(0);

//   useEffect(() => {
//     localStorage.setItem("sidebarWidth", String(sidebarWidth));
//   }, [sidebarWidth]);

//   const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
//     startX.current = e.clientX;
//     startWidth.current = sidebarWidth;
//     setDragging(true);
//     resizerRef.current?.setPointerCapture(e.pointerId);
//     document.body.style.cursor = "col-resize";
//     document.body.style.userSelect = "none";
//   };

//   const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
//     if (!resizerRef.current?.hasPointerCapture(e.pointerId)) return;
//     const delta = e.clientX - startX.current;
//     const next = Math.min(
//       Math.max(startWidth.current + delta, MIN_WIDTH),
//       MAX_WIDTH,
//     );
//     setSidebarWidth(next);
//   };

//   const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
//     setDragging(false);
//     resizerRef.current?.releasePointerCapture(e.pointerId);
//     document.body.style.cursor = "";
//     document.body.style.userSelect = "";
//   };

//   if (isLoadingMe) {
//     return <div>Загрузка...</div>;
//   }

//   if (isErrorMe || !me) {
//     return (
//       <div className={styles.error}>
//         Доступ запрещен. Убедитесь, что персональный сертификат сотрудника
//         установлен в системе и не истек.
//       </div>
//     );
//   }

//   return (
//     <div className={styles.mainContainer}>
//       <section
//         className={styles.sidebar}
//         style={{ width: sidebarWidth, minWidth: "240px" }}
//       >
//         <h1 className={styles.sidebarHeader}>
//           <span className={styles.displayNameContainer}>
//             <SquareUserRound />
//             {me.displayName}
//           </span>
//           <div className={styles.chatHeaderIcon}>
//             {/* <MessageCircle className={styles.iconStyle} /> */}
//             <span className={styles.sidebarHeaderText}>Chats</span>
//           </div>
//         </h1>
//         <ChatScroll
//           selectedChatId={selectedChatId}
//           onSelectChat={handleSelectChat}
//         />
//       </section>

//       <div
//         ref={resizerRef}
//         className={`${styles.resizer} ${dragging ? styles.dragging : ""}`}
//         onPointerDown={onPointerDown}
//         onPointerMove={onPointerMove}
//         onPointerUp={onPointerUp}
//         role="separator"
//         aria-orientation="vertical"
//         aria-valuenow={sidebarWidth}
//         aria-valuemin={MIN_WIDTH}
//         aria-valuemax={MAX_WIDTH}
//         tabIndex={0}
//       />

//       <section className={styles.chat}>
//         <section className={styles.chatHeader}>
//           <span className={styles.profileInfo}>
//             <CircleUserRound className={styles.circleUserRound} />
//             <span className={styles.profileInfoText}>
//               {selectedChatTitle || "Chat"}
//             </span>
//           </span>
//         </section>
//         <section className={styles.chatContainer}>
//           {!selectedChatId && (
//             <div className={styles.infoMessage}>Выберите чат</div>
//           )}
//           {isLoadingMessages && (
//             <div className={styles.infoMessage}>Загрузка сообщений...</div>
//           )}
//           {flatMessages.length === 0 && selectedChatId ? (
//             <div className={styles.infoMessage}>У вас пока нет сообщений</div>
//           ) : (
//             flatMessages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={
//                   msg.senderUsername === me?.username
//                     ? styles.myMessage
//                     : styles.otherMessage
//                 }
//               >
//                 <div>{msg.content}</div>
//                 <div className={styles.messageTime}>
//                   {new Date(msg.sentAt).toLocaleTimeString()}
//                 </div>
//               </div>
//             ))
//           )}
//         </section>
//         <section className={styles.messageInputContainer}>
//           <input
//             className={styles.messageInput}
//             type="text"
//             placeholder="Type a message"
//             value={messageText}
//             onChange={(e) => setMessageText(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSend();
//               }
//             }}
//           ></input>
//           <button
//             type="button"
//             onClick={handleSend}
//             className={styles.sendHorizontalContainer}
//           >
//             <SendHorizonal className={styles.sendHorizontal} />
//           </button>
//         </section>
//       </section>
//     </div>
//   );
// };

// export default ChatPage;

import styles from "./ChatPage.module.css";
import { useEffect, useRef, useState } from "react";
import { SquareUserRound, CircleUserRound, SendHorizonal } from "lucide-react";
import ChatScroll from "@components/ChatScroll";
import { createStompClient } from "@/socket-utils/connectws";
import type { Client, IMessage } from "@stomp/stompjs";
import { useMe } from "@/rest-queries/hooks";
import { useMessages } from "@rest-queries/hooks";
import type { Message } from "@rest-queries/types";
import { useQueryClient } from "@tanstack/react-query";

const MIN_WIDTH = 100;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 270;

const ChatPage = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [selectedChatTitle, setSelectedChatTitle] = useState<string>("");

  const handleSend = () => {
    if (!selectedChatId || !messageText.trim() || !clientRef.current) return;

    const payload = {
      chatId: selectedChatId,
      content: messageText.trim(),
      clientMessageId: crypto.randomUUID(),
    };

    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(payload),
    });

    setMessageText("");
  };

  const {
    data: messages,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
  } = useMessages(selectedChatId);

  const flatMessages: Message[] =
    messages?.pages.flatMap((page) => {
      if (Array.isArray(page)) return page; // если страница — массив
      return page.content ?? []; // если страница — объект Spring
    }) ?? [];

  const handleSelectChat = (chatId: number, title: string) => {
    setSelectedChatId(chatId);
    setSelectedChatTitle(title);
  };

  const { data: me, isLoading: isLoadingMe, isError: isErrorMe } = useMe();

  const clientRef = useRef<Client | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!me) return;

    console.log("ChatPage mounted");

    const client = createStompClient(
      (msg: IMessage) => {
        const data = JSON.parse(msg.body);
        queryClient.invalidateQueries({ queryKey: ["messages", data.chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      },
      () => console.log("Соединение установлено"),
      (err: string) => console.error("Ошибка STOMP:", err),
    );

    clientRef.current = client;

    return () => {
      // Закрываем сокет при размонтировании/смене пользователя, иначе
      // в Strict Mode и при повторных запусках эффекта копятся соединения.
      client.deactivate();
      if (clientRef.current === client) clientRef.current = null;
    };
    // Подключаемся, когда загрузился пользователь (me). С пустым массивом
    // зависимостей эффект срабатывал один раз, ещё до загрузки me, и сокет
    // не открывался вообще.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.username]);

  const [messageText, setMessageText] = useState<string>("");
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = Number(localStorage.getItem("sidebarWidth"));
    return Number.isFinite(saved) && saved > 0
      ? Math.min(Math.max(saved, MIN_WIDTH), MAX_WIDTH)
      : DEFAULT_WIDTH;
  });
  const [dragging, setDragging] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    setDragging(true);
    resizerRef.current?.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizerRef.current?.hasPointerCapture(e.pointerId)) return;
    const delta = e.clientX - startX.current;
    const next = Math.min(
      Math.max(startWidth.current + delta, MIN_WIDTH),
      MAX_WIDTH,
    );
    setSidebarWidth(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    resizerRef.current?.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  if (isLoadingMe) {
    return <div>Загрузка...</div>;
  }

  if (isErrorMe || !me) {
    return (
      <div className={styles.error}>
        Доступ запрещен. Убедитесь, что персональный сертификат сотрудника
        установлен в системе и не истек.
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <section
        className={styles.sidebar}
        style={{ width: sidebarWidth, minWidth: "240px" }}
      >
        <h1 className={styles.sidebarHeader}>
          <span className={styles.displayNameContainer}>
            <SquareUserRound />
            {me.displayName}
          </span>
          <div className={styles.chatHeaderIcon}>
            {/* <MessageCircle className={styles.iconStyle} /> */}
            <span className={styles.sidebarHeaderText}>Chats</span>
          </div>
        </h1>
        <ChatScroll
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </section>

      <div
        ref={resizerRef}
        className={`${styles.resizer} ${dragging ? styles.dragging : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={sidebarWidth}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        tabIndex={0}
      />

      <section className={styles.chat}>
        <section className={styles.chatHeader}>
          <span className={styles.profileInfo}>
            <CircleUserRound className={styles.circleUserRound} />
            <span className={styles.profileInfoText}>
              {selectedChatTitle || "Chat"}
            </span>
          </span>
        </section>
        <section className={styles.chatContainer}>
          {!selectedChatId && (
            <div className={styles.infoMessage}>Выберите чат</div>
          )}
          {isLoadingMessages && (
            <div className={styles.infoMessage}>Загрузка сообщений...</div>
          )}
          {flatMessages.length === 0 && selectedChatId ? (
            <div className={styles.infoMessage}>У вас пока нет сообщений</div>
          ) : (
            flatMessages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.senderUsername === me?.username
                    ? styles.myMessage
                    : styles.otherMessage
                }
              >
                <div>{msg.content}</div>
                <div className={styles.messageTime}>
                  {new Date(msg.sentAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </section>
        <section className={styles.messageInputContainer}>
          <input
            className={styles.messageInput}
            type="text"
            placeholder="Type a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          ></input>
          <button
            type="button"
            onClick={handleSend}
            className={styles.sendHorizontalContainer}
          >
            <SendHorizonal className={styles.sendHorizontal} />
          </button>
        </section>
      </section>
    </div>
  );
};

export default ChatPage;
