import styles from "./ChatScroll.module.css";
import { Search, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Chat from "@components/Chat";
import { useSearch, useCreatePrivateChat, useMe } from "@rest-queries/hooks";
import { Flipper, Flipped } from "react-flip-toolkit";
import type { Chats } from "@rest-queries/types";

type ChatScrollProps = {
  chats: Chats;
  isLoadingChats: boolean;
  isErrorChats: boolean;
  selectedChatId?: number | null;
  onSelectChat?: (chatId: number, title: string) => void;
};

const ChatScroll = ({
  chats,
  isLoadingChats,
  isErrorChats,
  selectedChatId,
  onSelectChat,
}: ChatScrollProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const { data: me } = useMe();

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
  } = useSearch(debouncedQuery);

  const createPrivateChat = useCreatePrivateChat();

  useEffect(() => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setDebouncedQuery("");
      return;
    }

    const timerId = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 350);

    return () => clearTimeout(timerId);
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue("");
    setDebouncedQuery("");
  };

  const handleStartChat = (username: string) => {
    createPrivateChat.mutate(username, {
      onSuccess: (createdChat) => {
        handleClear();
        onSelectChat?.(createdChat.id, createdChat.title);
      },
    });
  };

  const isSearchMode = inputValue.trim().length > 0;

  const filteredUsers = searchResults?.filter(
    (user) => user.username !== me?.username,
  );

  const flipKey = useMemo(() => JSON.stringify(chats), [chats]);

  return (
    <div className={styles.chatScroll}>
      <form className={styles.searchLine} onSubmit={handleSubmit}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by username..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {isSearchMode ? (
          <button
            type="button"
            onClick={handleClear}
            className={styles.searchButton}
            aria-label="Clear search"
          >
            <X className={styles.search} />
          </button>
        ) : (
          <button type="submit" className={styles.searchButton}>
            <Search className={styles.search} />
          </button>
        )}
      </form>
      <Flipper flipKey={flipKey} spring="stiff">
        <section className={styles.userChats}>
          {isSearchMode ? (
            <>
              {(isSearching || inputValue.trim() !== debouncedQuery) && (
                <div className={styles.infoText}>Searching...</div>
              )}

              {isSearchError && (
                <div className={styles.infoText}>
                  Ошибка при поиске сотрудников
                </div>
              )}

              {!isSearching &&
                inputValue.trim() === debouncedQuery &&
                filteredUsers?.length === 0 && (
                  <div className={styles.infoText}>Никого не найдено</div>
                )}

              {filteredUsers?.map((user) => (
                <Flipped key={user.username} flipId={`user-${user.username}`}>
                  <div onClick={() => handleStartChat(user.username)}>
                    <Chat
                      name={user.displayName || user.username}
                      lastMessage={`@${user.displayName}`}
                    />
                  </div>
                </Flipped>
              ))}
            </>
          ) : (
            <>
              {isLoadingChats && (
                <div className={styles.infoText}>Загрузка чатов...</div>
              )}
              {isErrorChats && (
                <div className={styles.infoText}>Не удалось загрузить чаты</div>
              )}

              {chats?.map((chat) => (
                <Flipped key={chat.id} flipId={`chat-${chat.id}`}>
                  <div onClick={() => onSelectChat?.(chat.id, chat.title)}>
                    <Chat
                      name={chat.title}
                      lastMessage={
                        chat.lastMessage
                          ? chat.lastMessage.senderUsername === me?.username
                            ? `You: ${chat.lastMessage.content}`
                            : chat.lastMessage.content
                          : "Write a message..."
                      }
                      unreadCount={chat.unreadCount}
                      isActive={chat.id === selectedChatId}
                    />
                  </div>
                </Flipped>
              ))}
            </>
          )}
        </section>
      </Flipper>
    </div>
  );
};

export default ChatScroll;
