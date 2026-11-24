import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  MeData,
  Search,
  Chats,
  ChatDetails,
  MessagesPage,
} from "@/rest-queries/types";

// Браузер ходит на бэкенд напрямую и сам предъявляет ему сертификат
const serverName = import.meta.env.VITE_SERVER_NAME || window.location.hostname;

export const API_BASE_URL = `https://${serverName}:8443`;

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  return res.json();
}

export const useMe = () => {
  return useQuery<MeData>({
    queryKey: ["me"],
    queryFn: ({ signal }) => fetchApi<MeData>("/api/v1/users/me", { signal }),
    retry: false,
    staleTime: 0,
    gcTime: 0, // не хранить в кэше после размонтирования
    refetchOnMount: "always",
  });
};

const FAVORITES_TITLE = "Избранное";

export const useChats = () => {
  return useQuery<Chats>({
    queryKey: ["chats"],
    queryFn: ({ signal }) => fetchApi<Chats>("/api/v1/chats", { signal }),
    select: (data) =>
      [...data].sort((a, b) => {
        const aFav = a.title === FAVORITES_TITLE;
        const bFav = b.title === FAVORITES_TITLE;
        if (aFav !== bFav) return aFav ? -1 : 1;

        const aTime = a.lastMessage
          ? new Date(a.lastMessage.sentAt).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.sentAt).getTime()
          : 0;
        return bTime - aTime;
      }),
  });
};

export const useMessages = (chatId: number | null) => {
  return useInfiniteQuery<MessagesPage>({
    queryKey: ["messages", chatId],
    queryFn: ({ pageParam = 0, signal }) =>
      fetchApi<MessagesPage>(
        `/api/v1/chats/${chatId}/messages?page=${pageParam}&size=50`,
        { signal },
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Если бэкенд вернул просто массив Message[]
      if (Array.isArray(lastPage)) {
        return lastPage.length === 50 ? allPages.length : undefined;
      }
      // Если бэкенд вернул объект пагинации Spring
      if (typeof lastPage.hasNext === "boolean") {
        return lastPage.hasNext ? allPages.length : undefined;
      }
      if (typeof lastPage.last === "boolean") {
        return !lastPage.last ? allPages.length : undefined;
      }
      return undefined;
    },
    enabled: chatId !== null,
  });
};

export const useSearch = (searchString: string) => {
  const trimmed = searchString.trim();

  return useQuery<Search>({
    queryKey: ["users", "search", trimmed],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ query: trimmed });
      return fetchApi<Search>(`/api/v1/users/search?${params.toString()}`, {
        signal,
      });
    },
    enabled: trimmed.length > 0,
    staleTime: 30_000,
  });
};

export const useCreatePrivateChat = () => {
  const queryClient = useQueryClient();

  return useMutation<ChatDetails, Error, string>({
    mutationFn: (username) =>
      fetchApi<ChatDetails>("/api/v1/chats/private", {
        method: "POST",
        body: JSON.stringify({ recipientUsername: username }),
        // body: username,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();

  return useMutation<ChatDetails, Error, { title: string; members: string[] }>({
    mutationFn: (payload) =>
      fetchApi<ChatDetails>("/api/v1/chats/group", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
