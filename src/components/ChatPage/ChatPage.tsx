import styles from "./ChatPage.module.css";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, CircleUserRound, SendHorizonal } from "lucide-react";
import ChatScroll from "@components/ChatScroll";

const MIN_WIDTH = 100;
const MAX_WIDTH = 800; // максимум в px
const DEFAULT_WIDTH = 270;

const ChatPage = () => {
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

  return (
    <div className={styles.mainContainer}>
      <section className={styles.sidebar} style={{ width: sidebarWidth }}>
        <h1 className={styles.sidebarHeader}>
          <MessageSquare className={styles.messageSquare} />
          <span className={styles.sidebarHeaderText}>Chats</span>
        </h1>
        <ChatScroll />
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
            <span className={styles.profileInfoText}>Андрюха Пальто</span>
          </span>
        </section>
        <section className={styles.chatContainer}>
          <div>message</div>
        </section>
        <section className={styles.messageInputContainer}>
          <input
            className={styles.messageInput}
            type="text"
            placeholder="Type a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          ></input>
          <button
            type="button"
            onClick={() => console.log("message send")}
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
