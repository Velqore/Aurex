import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: string;
  senderId: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  type: "text" | "file" | "image" | "system" | "command";
  metadata?: {
    fileSize?: number;
    fileName?: string;
    fileType?: string;
    hash?: string;
    fileUrl?: string;
    isImage?: boolean;
    replyPreview?: {
      id?: string;
      sender?: string;
      content?: string;
      type?: "text" | "file" | "image" | "system" | "command";
      fileName?: string;
    };
  };
  reactions?: { [userId: string]: string };
  isEdited?: boolean;
  replyTo?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "private" | "group" | "channel";
  members: string[];
  admins: string[];
  description?: string;
  isEncrypted: boolean;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    allowFileSharing: boolean;
    retentionDays: number;
    maxMembers: number;
  };
}

export interface Notification {
  id: string;
  type: "threat" | "message" | "system" | "security";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: "low" | "medium" | "high" | "critical";
  data?: any;
}

export interface ThreatAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  source: string;
  timestamp: Date;
  iocs: string[];
  tags: string[];
  tlp: "white" | "green" | "amber" | "red";
  starred: boolean;
  read: boolean;
  assignedTo?: string;
  status: "new" | "investigating" | "resolved" | "false-positive";
}

interface AppState {
  // Chat state
  chatRooms: ChatRoom[];
  messages: { [chatId: string]: ChatMessage[] };
  activeChat: string | null;
  typingUsers: { [chatId: string]: string[] };

  // Notifications
  notifications: Notification[];
  unreadNotifications: number;

  // Threat intelligence
  threatAlerts: ThreatAlert[];

  // UI state
  currentView: string;
  sidebarCollapsed: boolean;
  theme: "dark" | "light" | "cyber";

  // System state
  isOnline: boolean;
  lastSync: Date | null;

  // Actions
  // Chat actions
  createChatRoom: (
    room: Omit<ChatRoom, "id" | "createdAt" | "updatedAt">,
  ) => string;
  joinChatRoom: (roomId: string, userId: string) => void;
  leaveChatRoom: (roomId: string, userId: string) => void;
  sendMessage: (
    chatId: string,
    message: Omit<ChatMessage, "id" | "timestamp"> &
      Partial<Pick<ChatMessage, "id" | "timestamp">>,
  ) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  clearChatMessages: (chatId: string) => void;
  markMessagesAsRead: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  setTypingStatus: (chatId: string, userId: string, isTyping: boolean) => void;

  // Notification actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Threat actions
  addThreatAlert: (alert: Omit<ThreatAlert, "id" | "timestamp">) => void;
  updateThreatAlert: (alertId: string, updates: Partial<ThreatAlert>) => void;

  // UI actions
  setCurrentView: (view: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light" | "cyber") => void;

  // System actions
  setOnlineStatus: (isOnline: boolean) => void;
  syncData: () => Promise<void>;
}

// Mock data
const mockChatRooms: ChatRoom[] = [
  {
    id: "1",
    name: "Red Team Alpha",
    type: "group",
    members: ["1", "2", "3", "4"],
    admins: ["1"],
    description: "Offensive security operations team",
    isEncrypted: true,
    unreadCount: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    settings: {
      allowFileSharing: true,
      retentionDays: 30,
      maxMembers: 10,
    },
  },
  {
    id: "2",
    name: "Blue Team Defense",
    type: "group",
    members: ["1", "5", "6", "7", "8"],
    admins: ["5"],
    description: "Defensive security monitoring team",
    isEncrypted: true,
    unreadCount: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    settings: {
      allowFileSharing: true,
      retentionDays: 60,
      maxMembers: 15,
    },
  },
];

// Custom serialization functions for Date objects
const dateReviver = (key: string, value: any) => {
  if (
    typeof value === "string" &&
    (key.endsWith("At") || key === "timestamp" || key === "lastSync")
  ) {
    return new Date(value);
  }
  return value;
};

const serializer = {
  serialize: (state: any) => JSON.stringify(state),
  deserialize: (str: string) => {
    const parsed = JSON.parse(str);

    // Convert date strings back to Date objects
    const convertDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;

      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }

      if (typeof obj === "object") {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (
            typeof value === "string" &&
            (key.endsWith("At") || key === "timestamp" || key === "lastSync")
          ) {
            converted[key] = new Date(value);
          } else if (typeof value === "object") {
            converted[key] = convertDates(value);
          } else {
            converted[key] = value;
          }
        }
        return converted;
      }

      return obj;
    };

    return convertDates(parsed);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      chatRooms: mockChatRooms,
      messages: {},
      activeChat: null,
      typingUsers: {},
      notifications: [],
      unreadNotifications: 0,
      threatAlerts: [],
      currentView: "chat",
      sidebarCollapsed: false,
      theme: "cyber",
      isOnline: true,
      lastSync: null,

      // Chat actions
      createChatRoom: (roomData) => {
        const roomId = Math.random().toString(36).substr(2, 9);
        const newRoom: ChatRoom = {
          ...roomData,
          id: roomId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chatRooms: [...state.chatRooms, newRoom],
        }));

        return roomId;
      },

      joinChatRoom: (roomId, userId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  members: [...room.members, userId],
                  updatedAt: new Date(),
                }
              : room,
          ),
        }));
      },

      leaveChatRoom: (roomId, userId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  members: room.members.filter((id: string) => id !== userId),
                  updatedAt: new Date(),
                }
              : room,
          ),
        }));
      },

      sendMessage: (chatId, messageData) => {
        const messageId = messageData.id || Math.random().toString(36).substr(2, 9);
        const message: ChatMessage = {
          ...messageData,
          id: messageId,
          timestamp: messageData.timestamp || new Date(),
        };

        set((state) => {
          const chatMessages = state.messages[chatId] || [];
          if (chatMessages.some((msg) => msg.id === messageId)) {
            return state;
          }

          return {
            messages: {
              ...state.messages,
              [chatId]: [...chatMessages, message],
            },
            chatRooms: state.chatRooms.map((room) =>
              room.id === chatId
                ? { ...room, lastMessage: message, updatedAt: new Date() }
                : room,
            ),
          };
        });
      },

      editMessage: (messageId, content) => {
        set((state) => ({
          messages: Object.fromEntries(
            Object.entries(state.messages).map(([chatId, chatMessages]) => [
              chatId,
              chatMessages.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content, isEdited: true }
                  : msg,
              ),
            ]),
          ),
        }));
      },

      deleteMessage: (messageId) => {
        set((state) => ({
          messages: Object.fromEntries(
            Object.entries(state.messages).map(([chatId, chatMessages]) => [
              chatId,
              chatMessages.filter((msg) => msg.id !== messageId),
            ]),
          ),
        }));
      },

      clearChatMessages: (chatId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [],
          },
          chatRooms: state.chatRooms.map((room) =>
            room.id === chatId
              ? { ...room, lastMessage: undefined, unreadCount: 0, updatedAt: new Date() }
              : room,
          ),
        }));
      },

      markMessagesAsRead: (chatId) => {
        set((state) => ({
          chatRooms: state.chatRooms.map((room) =>
            room.id === chatId ? { ...room, unreadCount: 0 } : room,
          ),
        }));
      },

      setActiveChat: (chatId) => {
        set({ activeChat: chatId });
        if (chatId) {
          get().markMessagesAsRead(chatId);
        }
      },

      setTypingStatus: (chatId, userId, isTyping) => {
        set((state) => {
          const typingUsers = { ...state.typingUsers };
          if (!typingUsers[chatId]) {
            typingUsers[chatId] = [];
          }

          if (isTyping) {
            if (!typingUsers[chatId].includes(userId)) {
              typingUsers[chatId].push(userId);
            }
          } else {
            typingUsers[chatId] = typingUsers[chatId].filter(
              (id) => id !== userId,
            );
          }

          return { typingUsers };
        });
      },

      // Notification actions
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadNotifications: state.unreadNotifications + 1,
        }));
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif,
          ),
          unreadNotifications: Math.max(0, state.unreadNotifications - 1),
        }));
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadNotifications: 0,
        });
      },

      // Threat actions
      addThreatAlert: (alertData) => {
        const alert: ThreatAlert = {
          ...alertData,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        };

        set((state) => ({
          threatAlerts: [alert, ...state.threatAlerts],
        }));

        // Also add as notification
        get().addNotification({
          type: "threat",
          title: `New ${alert.severity.toUpperCase()} Threat Alert`,
          message: alert.title,
          priority: alert.severity,
          actionUrl: "/threats",
          data: { alertId: alert.id },
          read: false,
        });
      },

      updateThreatAlert: (alertId, updates) => {
        set((state) => ({
          threatAlerts: state.threatAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, ...updates } : alert,
          ),
        }));
      },

      // UI actions
      setCurrentView: (view) => {
        set({ currentView: view });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      // System actions
      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      syncData: async () => {
        // Simulate data sync
        set({ lastSync: new Date() });
      },
    }),
    {
      name: "app-storage",
      skipHydration: true,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return serializer.deserialize(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, serializer.serialize(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
