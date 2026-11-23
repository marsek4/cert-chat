import styles from "./ChatPage.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
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

  // кто печатает в каждом чате: chatId -> Set<username>
  const [typingUsers, setTypingUsers] = useState<Record<number, Set<string>>>(
    {},
  );

  // таймер отправки TYPING_STOP (пока я печатаю)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // таймеры автосброса «печатает» у собеседника (если TYPING_STOP потерялся)
  const remoteTypingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

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

  // Триггер автоскролла — id последнего сообщения, а не длина.
  // При подгрузке старых сообщений (пагинация вверх) длина меняется,
  // а id последнего — нет, поэтому скролл вниз не сработает.
  const lastMessageId = flatMessages[flatMessages.length - 1]?.id ?? null;

  const markAsRead = useCallback(
    (chatId: number, messageId: number, actorUsername: string) => {
      if (!clientRef.current) return;
      clientRef.current.publish({
        destination: "/app/chat.read",
        body: JSON.stringify({
          type: "MESSAGES_READ",
          chatId,
          actorUsername,
          messageId,
        }),
      });
    },
    [],
  );

  const handleSelectChat = (chatId: number, title: string) => {
    setSelectedChatId(chatId);
    setSelectedChatTitle(title);
    lastReadIdRef.current = 0; // новый чат — начинаем заново
  };

  const { data: me, isLoading: isLoadingMe, isError: isErrorMe } = useMe();

  const clientRef = useRef<Client | null>(null);
  const lastReadIdRef = useRef<number>(0);
  const queryClient = useQueryClient();

  const sendTyping = (typing: boolean) => {
    if (!selectedChatId || !clientRef.current || !me?.username) return;
    clientRef.current.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        type: typing ? "TYPING_START" : "TYPING_STOP",
        chatId: selectedChatId,
        actorUsername: me.username,
        messageId: null,
      }),
    });
  };

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

    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  };

  useEffect(() => {
    if (!me) return;

    console.log("ChatPage mounted");

    const client = createStompClient(
      (msg: IMessage) => {
        const data = JSON.parse(msg.body);

        if (data.type === "TYPING_START" || data.type === "TYPING_STOP") {
          const { chatId, actorUsername, type } = data;

          // игнорируем собственные события (если сервер шлёт и отправителю)
          if (actorUsername === me?.username) return;

          setTypingUsers((prev) => {
            const next = { ...prev };
            const set = new Set(next[chatId] ?? []);
            if (type === "TYPING_START") set.add(actorUsername);
            else set.delete(actorUsername);
            next[chatId] = set;
            return next;
          });

          // автосброс через 5 с, если TYPING_STOP не пришёл
          const key = `${chatId}:${actorUsername}`;
          if (remoteTypingTimeoutsRef.current[key]) {
            clearTimeout(remoteTypingTimeoutsRef.current[key]);
          }
          if (type === "TYPING_START") {
            remoteTypingTimeoutsRef.current[key] = setTimeout(() => {
              setTypingUsers((prev) => {
                const next = { ...prev };
                const set = new Set(next[chatId] ?? []);
                set.delete(actorUsername);
                next[chatId] = set;
                return next;
              });
            }, 5000);
          }
          return;
        }

        if (data.type === "MESSAGES_READ") {
          // кто-то прочитал — обновляем список чатов (unreadCount)
          // и сообщения (статус «прочитано», если отображаете)
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({
            queryKey: ["messages", data.chatId],
          });
          return;
        }

        // обычное новое сообщение
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.username]);

  useEffect(() => {
    // при смене чата сбрасываем таймер отправки STOP
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      isTypingRef.current = false;
    };
  }, [selectedChatId]);

  // очистка таймеров автосброса при размонтировании
  useEffect(() => {
    return () => {
      Object.values(remoteTypingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevChatIdRef = useRef<number | null>(null);

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const chatChanged = prevChatIdRef.current !== selectedChatId;
    prevChatIdRef.current = selectedChatId;

    if (chatChanged) {
      // При переключении чата — мгновенно вниз, без анимации перемотки.
      // requestAnimationFrame — чтобы дождаться отрисовки новых сообщений
      // и получить корректный scrollHeight.
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        isAtBottomRef.current = true;
      });
      return;
    }

    // Новое сообщение в текущем чате — плавно, только если были внизу.
    if (isAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [lastMessageId, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId || !me?.username) return;

    const last = flatMessages[flatMessages.length - 1];
    if (!last) return;

    // своё сообщение не отмечаем
    if (last.senderUsername === me.username) return;

    // пользователь не внизу — не считается прочитанным
    if (!isAtBottomRef.current) return;

    // уже отправляли этот id — не спамим
    if (last.id <= lastReadIdRef.current) return;

    lastReadIdRef.current = last.id;
    markAsRead(selectedChatId, last.id, me.username);
  }, [selectedChatId, lastMessageId, me?.username, markAsRead, flatMessages]);

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

  const typingSet = selectedChatId ? typingUsers[selectedChatId] : undefined;
  const typingLabel =
    typingSet && typingSet.size > 0
      ? `${[...typingSet].join(", ")} печатает…`
      : null;

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
            <span className={styles.profileTextBlock}>
              <span className={styles.profileInfoText}>
                {selectedChatTitle || "Chat"}
              </span>
              {typingLabel && (
                <span className={styles.typingStatus}>{typingLabel}</span>
              )}
            </span>
          </span>
        </section>
        <section
          className={styles.chatContainer}
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {!selectedChatId && (
            <div className={styles.infoMessage}>Выберите чат</div>
          )}
          {isErrorMessages && (
            <div className={styles.infoMessage}>Ошибка при загрузке чата</div>
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
            onChange={handleInputChange}
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
