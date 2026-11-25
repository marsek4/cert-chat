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

export type Member = {
  username: string;
  displayName: string;
  lastSeenAt: string;
};

type Chat = {
  id: number;
  title: string;
  members: Member[];
  lastMessage: Message | null;
  unreadCount: number;
};

export type Chats = Chat[];

export type ChatDetails = {
  id: number;
  type: "PRIVATE" | "GROUP";
  title: string;
  members: UserProfile[];
  lastMessage: Message;
  unreadCount: number;
};

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

export type Search = Member[];
