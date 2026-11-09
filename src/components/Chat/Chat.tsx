import styles from "./Chat.module.css";
import { SquareUserRound } from "lucide-react";

export type ChatProps = {
  name: string;
  lastMessage: string;
};

const Chat = ({ name, lastMessage }: ChatProps) => {
  return (
    <div className={styles.chatItem}>
      <SquareUserRound className={styles.chatIcon} />
      <div className={styles.textContainer}>
        <p className={styles.chatName}>{name}</p>
        <p className={styles.chatLastMessage}>{lastMessage}</p>
      </div>
    </div>
  );
};

export default Chat;
