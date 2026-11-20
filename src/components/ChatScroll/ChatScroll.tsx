import styles from "./ChatScroll.module.css";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import Chat from "@components/Chat";
import {
  useSearch,
  useChats,
  useCreatePrivateChat,
  useMe,
} from "@rest-queries/hooks";

type ChatScrollProps = {
  selectedChatId?: number | null;
  onSelectChat?: (chatId: number, title: string) => void;
};

const ChatScroll = ({ selectedChatId, onSelectChat }: ChatScrollProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const { data: me } = useMe();
  const {
    data: chats,
    isLoading: isLoadingChats,
    isError: isErrorChats,
  } = useChats();

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
  } = useSearch(debouncedQuery);

  const createPrivateChat = useCreatePrivateChat();

  // Debounce: обновляем поисковый запрос через 350 мс после последнего ввода
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
        handleClear(); // сбрасываем поиск и возвращаемся к списку чатов
        onSelectChat?.(createdChat.id, createdChat.title);
      },
    });
  };

  const isSearchMode = inputValue.trim().length > 0;

  // Исключаем текущего пользователя из результатов поиска
  const filteredUsers = searchResults?.filter(
    (user) => user.username !== me?.username,
  );

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
            aria-label="Очистить поиск"
          >
            <X className={styles.search} />
          </button>
        ) : (
          <button type="submit" className={styles.searchButton}>
            <Search className={styles.search} />
          </button>
        )}
      </form>

      <section className={styles.userChats}>
        {isSearchMode ? (
          /* РЕЖИМ ПОИСКА */
          <>
            {(isSearching || inputValue.trim() !== debouncedQuery) && (
              <div>Поиск...</div>
            )}

            {isSearchError && (
              <div className={styles.infoText}>
                Ошибка при поиске сотрудников
              </div>
            )}

            {!isSearching &&
              inputValue.trim() === debouncedQuery &&
              filteredUsers?.length === 0 && (
                <div className={styles.infoText}>Ничего не найдено</div>
              )}

            {filteredUsers?.map((user) => (
              <div
                key={user.username}
                onClick={() => handleStartChat(user.username)}
              >
                <Chat
                  name={user.displayName || user.username}
                  lastMessage={`@${user.username}`}
                />
              </div>
            ))}
          </>
        ) : (
          /* ОБЫЧНЫЙ РЕЖИМ */
          <>
            {/* <Chat name="Saved Messages" lastMessage="flag={karamba}" /> */}

            {isLoadingChats && (
              <div className={styles.infoText}>Загрузка чатов...</div>
            )}
            {isErrorChats && (
              <div className={styles.infoText}>Не удалось загрузить чаты</div>
            )}

            {chats?.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat?.(chat.id, chat.title)}
              >
                <Chat
                  name={chat.title}
                  lastMessage={chat.lastMessage ?? ""}
                  unreadCount={chat.unreadCount}
                  isActive={chat.id === selectedChatId}
                />
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
};

export default ChatScroll;

// В терминале выполните команду, чтобы сбросить кэш сокетов на уровне системы (macOS):

// bash
// sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
// Запустите Chrome с флагом, который отключает кэширование TLS-сессий (только для теста):

// bash
// open -a "Google Chrome" --args --disable-session-cache
// Зайдите на сайт.
