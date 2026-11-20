// import {
//   useQuery,
//   useInfiniteQuery,
//   useMutation,
//   useQueryClient,
// } from "@tanstack/react-query";
// import type { MeData, Search, Chats } from "@/rest-queries/types";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// // Единая обертка над fetch с проверкой статуса и credentials
// async function fetchApi<T>(
//   endpoint: string,
//   options?: RequestInit,
// ): Promise<T> {
//   const res = await fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...options?.headers,
//     },
//   });

//   if (!res.ok) {
//     throw new Error(`HTTP error ${res.status}`);
//   }

//   return res.json();
// }

// export const useMe = () => {
//   return useQuery<MeData>({
//     queryKey: ["me"],
//     queryFn: ({ signal }) => fetchApi<MeData>("/api/v1/users/me", { signal }),
//     retry: false, // для mTLS-ошибок повторять бессмысленно
//   });
// };

// export const useChats = () => {
//   return useQuery<Chats>({
//     queryKey: ["chats"],
//     queryFn: ({ signal }) => fetchApi<Chats>("/api/v1/chats", { signal }),
//   });
// };

// export const useMessages = (chatId: string | null) => {
//   return useInfiniteQuery({
//     queryKey: ["messages", chatId],
//     queryFn: ({ pageParam = 0, signal }) =>
//       fetchApi<any>(
//         `/api/v1/chats/${chatId}/messages?page=${pageParam}&size=50`,
//         { signal },
//       ),
//     initialPageParam: 0,
//     getNextPageParam: (lastPage, allPages) => {
//       // Если бэкенд возвращает объект Spring Page (last: boolean) или hasNext:
//       if (typeof lastPage.hasNext === "boolean") {
//         return lastPage.hasNext ? allPages.length : undefined;
//       }
//       if (typeof lastPage.last === "boolean") {
//         return !lastPage.last ? allPages.length : undefined;
//       }
//       return undefined;
//     },
//     enabled: Boolean(chatId), // не запрашиваем сообщения, пока чат не выбран
//   });
// };

// export const useSearch = (searchString: string) => {
//   const trimmed = searchString.trim();

//   return useQuery<Search>({
//     queryKey: ["users", "search", trimmed],
//     queryFn: ({ signal }) => {
//       const params = new URLSearchParams({ query: trimmed });
//       return fetchApi<Search>(`/api/v1/users/search?${params.toString()}`, {
//         signal,
//       });
//     },
//     enabled: trimmed.length > 0,
//     staleTime: 30_000, // кэшируем результаты поиска на 30 секунд
//   });
// };

// // Мутация для старта личного диалога при клике на найденного сотрудника
// export const useCreatePrivateChat = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (targetUsername: string) =>
//       fetchApi<any>("/api/v1/chats/private", {
//         method: "POST",
//         body: JSON.stringify({ username: targetUsername }),
//       }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["chats"] });
//     },
//   });
// };

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

const API_BASE_URL = import.meta.env.API_BASE_URL ?? "";

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

export const useChats = () => {
  return useQuery<Chats>({
    queryKey: ["chats"],
    queryFn: ({ signal }) => fetchApi<Chats>("/api/v1/chats", { signal }),
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
