// /api/v1/me
export type MeData = {
  username: string;
  displayName: string;
  lastSeenAt: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  lastSeenAt: string;
};

// /api/v1/chats
type Chat = {
  id: number;
  title: string;
  members: string[];
  lastMessage: string | null;
  unreadCount: number;
};

export type Chats = Chat[];

export type ChatDetails = {
  id: number;
  type: "PRIVATE" | "GROUP";
  title: string;
  members: UserProfile[];
  lastMessage: Message | null;
  unreadCount: number;
};

// /api/v1/chats/{chatId}/messages
export type Message = {
  id: number;
  chatId: number;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  sentAt: string;
  clientMessageId: string;
};

export type Messages = Message[];

export type MessagesPage =
  | {
      content: Message[];
      last?: boolean;
      hasNext?: boolean;
      totalPages?: number;
      number?: number;
    }
  | Message[];

// /api/v1/users/search
type Member = {
  username: string;
  displayName: string;
  lastSeenAt: string;
};

export type Search = Member[];
