export interface User {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
  friends: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  reactions: Record<string, string[]>; // emoji -> user ID list
  mediaUrl?: string;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  type: "direct" | "group";
  participants: string[];
  messages: Message[];
  unreadCount: Record<string, number>;
  typingUserIds?: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  likes: string[];
  reactions: Record<string, string[]>; // reactionType -> array of user IDs
  comments: Comment[];
  isPinned?: boolean;
  groupId?: string; // e.g., "tech", "design", "general"
}

export interface UserStatus {
  id: string;
  authorId: string;
  text: string;
  mediaUrl: string;
  createdAt: string;
  viewers: string[];
}

export interface AppState {
  activeUserId: string;
  users: User[];
  chats: Chat[];
  posts: Post[];
  statuses: UserStatus[];
  isAiLive: boolean;
}
