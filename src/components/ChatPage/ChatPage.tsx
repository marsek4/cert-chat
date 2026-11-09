import styles from "./ChatPage.module.css";
import { useState } from "react";
import { MessageSquare, CircleUserRound, SendHorizonal } from "lucide-react";
import ChatScroll from "@components/ChatScroll";

const ChatPage = () => {
  const [messageText, setMessageText] = useState<string>("");

  return (
    <div className={styles.mainContainer}>
      <section className={styles.sidebar}>
        <h1 className={styles.sidebarHeader}>
          <MessageSquare className={styles.messageSquare} />
          Chats
        </h1>
        <ChatScroll />
      </section>
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
