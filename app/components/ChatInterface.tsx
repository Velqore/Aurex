"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Lock,
  Users,
  Search,
  MoreVertical,
  Shield,
  Clock,
  CheckCheck,
  Trash2,
  MessageCircle,
  Plus,
  UserPlus,
  Phone,
  Video,
  Settings,
  Archive,
  Pin,
  Bell,
  BellOff,
  Edit3,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppStore, ChatRoom, ChatMessage } from "../../lib/stores/appStore";
import { useAuthStore } from "../../lib/stores/authStore";
import { realTimeUserService, RealTimeUser } from "../../lib/services/realTimeUserService";

interface ChatInterfaceProps {
  user: any;
}

// Using interfaces from appStore

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const {
    chatRooms,
    messages,
    activeChat,
    sendMessage,
    setActiveChat,
    markMessagesAsRead,
    createChatRoom,
  } = useAppStore();
  const { getCurrentUser } = useAuthStore();

  // Enhanced state management
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [realTimeUsers, setRealTimeUsers] = useState<RealTimeUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<ChatRoom | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<RealTimeUser | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');

  const currentUser = getCurrentUser();
  const activeChatMessages = activeChat ? messages[activeChat] || [] : [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Real-time connection simulation and message handling
  useEffect(() => {
    // Simulate connection status changes
    const connectionInterval = setInterval(() => {
      const statuses: Array<'connected' | 'connecting' | 'disconnected'> = ['connected', 'connecting', 'disconnected'];
      const randomStatus = statuses[Math.floor(Math.random() * 3)];
      if (Math.random() > 0.95) { // Occasionally change status
        setConnectionStatus(randomStatus);
        setTimeout(() => setConnectionStatus('connected'), 2000);
      }
    }, 5000);

    return () => clearInterval(connectionInterval);
  }, []);

  // Real-time user management
  useEffect(() => {
    console.log('🔄 Setting up real-time user service...');
    
    // Subscribe to user updates
    const unsubscribe = realTimeUserService.subscribe((users) => {
      console.log('📥 Received user update:', users.length, 'users');
      setRealTimeUsers(users);
    });

    // Start periodic refresh (every 30 seconds)
    const stopRefresh = realTimeUserService.startPeriodicRefresh(30000);

    // Update user status to online when component mounts
    realTimeUserService.updateUserStatus(true);

    // Update user status to offline when component unmounts
    return () => {
      console.log('🔄 Cleaning up real-time user service...');
      realTimeUserService.updateUserStatus(false);
      unsubscribe();
      stopRefresh();
    };
  }, []);

  // Update filtered users based on real-time data
  const filteredUsers = realTimeUserService.searchUsers(userSearchTerm);

  // Enhanced message handling (keep only one handleSendMessage)
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !activeChat || !currentUser) return;

    const newMessage: ChatMessage = {
      chatId: activeChat,
      id: Date.now().toString(),
      senderId: currentUser.id,
      sender: currentUser.username,
      content: message.trim(),
      timestamp: new Date(),
      type: 'text',
      encrypted: true,
    };

    try {
      await sendMessage(activeChat, newMessage);
      setMessage("");

      // Simulate message delivery (without status property)
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, activeChat, currentUser, sendMessage]);

  // File upload handler
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!activeChat || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      try {
        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress >= 100) {
              clearInterval(uploadInterval);
              setIsUploading(false);
              setUploadProgress(0);
            }
            return Math.min(newProgress, 100);
          });
        }, 200);

        const fileMessage: ChatMessage = {
          chatId: activeChat,
          id: Date.now().toString(),
          senderId: currentUser.id,
          sender: currentUser.username,
          content: file.name,
          timestamp: new Date(),
          type: 'file',
          encrypted: true,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
          }
        };

        await sendMessage(activeChat, fileMessage);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  }, [activeChat, currentUser, sendMessage]);

  // Create new chat room
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;

    try {
      const roomId = await createChatRoom({
        name: newRoomName,
        type: "group",
        members: [currentUser?.id || ''],
        admins: [currentUser?.id || ''],
        description: `Secure channel: ${newRoomName}`,
        isEncrypted: true,
        unreadCount: 0,
        settings: {
          allowFileSharing: true,
          retentionDays: 30,
          maxMembers: 50
        }
      });

      setNewRoomName("");
      setShowCreateRoom(false);
      setActiveChat(roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  }, [newRoomName, createChatRoom, currentUser, setActiveChat]);

  // Typing indicator simulation
  const handleTyping = useCallback(() => {
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, []);

  // Handle room archive
  const handleArchiveRoom = useCallback(() => {
    if (activeChat) {
      // archiveRoom(activeChat);
      console.log('Archive room functionality not implemented yet');
      setActiveChat(null);
    }
    setShowMoreMenu(false);
  }, [activeChat, setActiveChat]);

  // Handle room pin
  const handlePinRoom = useCallback(() => {
    if (activeChat) {
      // pinRoom(activeChat);
      console.log('Pin room functionality not implemented yet');
    }
    setShowMoreMenu(false);
  }, [activeChat]);

  // User search and profile functions
  const handleViewProfile = useCallback((user: RealTimeUser) => {
    setSelectedUserProfile(user);
    setShowUserProfile(true);
  }, []);

  const handleStartPrivateChat = useCallback((user: RealTimeUser) => {
    if (!currentUser) return;

    // Check if private chat already exists
    const existingChat = chatRooms.find(room => 
      room.type === 'private' && 
      room.members.includes(user.id) && 
      room.members.includes(currentUser.id)
    );

    if (existingChat) {
      setActiveChat(existingChat.id);
      setShowUserProfile(false);
      return;
    }

    // Create new private chat
    const roomId = createChatRoom({
      name: `${user.firstName} ${user.lastName}`,
      type: 'private',
      members: [currentUser.id, user.id],
      admins: [currentUser.id],
      description: `Private chat with ${user.username}`,
      isEncrypted: true,
      unreadCount: 0,
      settings: {
        allowFileSharing: true,
        retentionDays: 365,
        maxMembers: 2,
      },
    });

    setActiveChat(roomId);
    setShowUserProfile(false);
  }, [currentUser, chatRooms, createChatRoom, setActiveChat]);

  // Handle room mute/unmute
  const handleMuteRoom = useCallback(() => {
    if (activeChat) {
      // muteRoom(activeChat);
      console.log('Mute room functionality not implemented yet');
    }
    setShowMoreMenu(false);
  }, [activeChat]);
  
  const handleUnmuteRoom = useCallback(() => {
    if (activeChat) {
      // unmuteRoom(activeChat);
      console.log('Unmute room functionality not implemented yet');
    }
    setShowMoreMenu(false);
  }, [activeChat]);

  // Handle room edit
  const handleEditRoom = useCallback(() => {
    const room = chatRooms.find(r => r.id === activeChat);
    if (room) {
      setRoomToEdit(room);
      setEditRoomName(room.name);
      setShowRoomSettings(true);
    }
    setShowMoreMenu(false);
  }, [activeChat, chatRooms]);

  const handleEditRoomSave = useCallback(() => {
    if (roomToEdit && editRoomName.trim()) {
      // editRoom(roomToEdit.id, { name: editRoomName.trim() });
      console.log('Edit room functionality not implemented yet');
      setShowRoomSettings(false);
      setRoomToEdit(null);
    }
  }, [roomToEdit, editRoomName]);

  // Handle room delete
  const handleDeleteRoom = useCallback(() => {
    if (activeChat) {
      // deleteRoom(activeChat);
      console.log('Delete room functionality not implemented yet');
      setActiveChat(null);
    }
    setShowMoreMenu(false);
  }, [activeChat, setActiveChat]);

  // Mock messages for active chat initialization
  useEffect(() => {
    if (activeChat && (!messages[activeChat] || messages[activeChat].length === 0)) {
      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          chatId: activeChat,
          sender: "System",
          senderId: "system",
          content: "End-to-end encryption enabled",
          timestamp: new Date(Date.now() - 3600000),
          encrypted: true,
          type: "system",
        },
        {
          id: "2",
          chatId: activeChat,
          sender: "Dr. Sarah Chen",
          senderId: "user2",
          content:
            "I've completed the initial analysis of the suspicious binary. The entropy levels suggest it's packed or encrypted.",
          timestamp: new Date(Date.now() - 1800000),
          encrypted: true,
          type: "text",
        },
        {
          id: "3",
          chatId: activeChat,
          sender: user?.username || "You",
          senderId: currentUser?.id || "current-user",
          content:
            "Can you run it through the unpacker? I suspect it might be UPX.",
          timestamp: new Date(Date.now() - 1500000),
          encrypted: true,
          type: "text",
        },
        {
          id: "4",
          chatId: activeChat,
          sender: "Dr. Sarah Chen",
          senderId: "user2",
          content:
            "Already tried UPX - no luck. This looks like custom packing. I'll need to reverse engineer it manually.",
          timestamp: new Date(Date.now() - 1200000),
          encrypted: true,
          type: "text",
        },
      ];
      // Mock messages would be handled by the store in a real implementation
    }
  }, [activeChat, user, currentUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return "Unknown";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if dateObj is a valid Date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "Unknown";
    }

    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastActivity = (date: Date | string | undefined) => {
    if (!date) return "Unknown";

    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if dateObj is a valid Date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "Unknown";
    }

    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-80 bg-cyber-gray border-r border-cyber-border flex flex-col">
        {/* Tabs */}
        <div className="p-4 border-b border-cyber-border">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-cyber-blue text-white'
                  : 'text-gray-400 hover:text-cyber-blue'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-cyber-blue text-white'
                  : 'text-gray-400 hover:text-cyber-blue'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Users
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'chats' ? "Search conversations..." : "Search users..."}
              value={activeTab === 'chats' ? searchTerm : userSearchTerm}
              onChange={(e) => activeTab === 'chats' ? setSearchTerm(e.target.value) : setUserSearchTerm(e.target.value)}
              className="cyber-input w-full pl-10 py-2"
            />
          </div>
          
          {activeTab === 'chats' && (
            <button
              className="cyber-button mt-2 w-full"
              onClick={() => setShowCreateRoom(true)}
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Room
            </button>
          )}
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? (
            /* Chat Rooms */
            chatRooms
            .filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((room) => (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChat(room.id)}
              className={`w-full p-4 border-b border-cyber-border text-left transition-all ${
                activeChat === room.id
                  ? "bg-cyber-blue bg-opacity-20 border-cyber-blue"
                  : "hover:bg-cyber-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-cyber-blue truncate">
                      {room.name}
                    </span>
                    {room.isEncrypted && (
                      <Shield className="h-3 w-3 text-cyber-green ml-1" />
                    )}
                    {room.type === "group" && (
                      <Users className="h-3 w-3 text-gray-400 ml-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate mb-1">
                    {room.lastMessage?.content || "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatLastActivity(room.updatedAt)}
                    </span>
                    {room.type === "group" && (
                      <span className="text-xs text-gray-500">
                        {room.members.length} members
                      </span>
                    )}
                  </div>
                </div>
                {room.unreadCount > 0 && (
                  <div className="bg-cyber-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {room.unreadCount}
                  </div>
                )}
              </div>
            </motion.button>
          ))
          ) : (
            /* User Directory - Real Users from Database */
            <>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <motion.button
                    key={user.id}
                    onClick={() => handleViewProfile(user)}
                    className="w-full p-3 hover:bg-cyber-border transition-colors text-left border-b border-cyber-border/50"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-cyber-gray ${
                          user.isOnline ? 'bg-cyber-green' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-cyber-blue truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            @{user.username}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {user.department}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {user.isOnline ? 'Online' : `Last seen ${formatLastActivity(user.lastActive)}`}
                          </span>
                          <div className="flex items-center space-x-1">
                            {user.role === 'admin' && (
                              <div className="w-2 h-2 bg-cyber-red rounded-full" title="Admin" />
                            )}
                            {user.role === 'enterprise' && (
                              <div className="w-2 h-2 bg-cyber-purple rounded-full" title="Enterprise" />
                            )}
                            {user.role === 'pro' && (
                              <div className="w-2 h-2 bg-cyber-blue rounded-full" title="Pro" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : realTimeUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-pulse">
                    <div className="text-cyber-blue mb-2">🔄 Loading users...</div>
                    <div className="text-sm">Fetching registered users from database</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  {userSearchTerm ? `No users found matching "${userSearchTerm}"` : 'No other users online'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-cyber-border bg-cyber-gray">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyber-blue rounded-full flex items-center justify-center">
                      <span className="text-cyber-dark text-sm font-bold">
                        {chatRooms.find((r) => r.id === activeChat)?.name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-cyber-blue">
                        {chatRooms.find((r) => r.id === activeChat)?.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-400">
                        <Lock className="h-3 w-3 mr-1 text-cyber-green" />
                        <span>End-to-end encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                    onClick={() => setShowMoreMenu((v) => !v)}
                    type="button"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {/* More menu for room actions */}
                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 bg-white border border-cyber-border rounded shadow-md z-10 min-w-[180px]">
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border" onClick={handlePinRoom} type="button">
                        <Pin className="h-4 w-4 mr-2" /> Pin Room
                      </button>
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border" onClick={handleArchiveRoom} type="button">
                        <Archive className="h-4 w-4 mr-2" /> Archive Room
                      </button>
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border" onClick={handleMuteRoom} type="button">
                        <BellOff className="h-4 w-4 mr-2" /> Mute Room
                      </button>
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border" onClick={handleUnmuteRoom} type="button">
                        <Bell className="h-4 w-4 mr-2" /> Unmute Room
                      </button>
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border" onClick={handleEditRoom} type="button">
                        <Edit3 className="h-4 w-4 mr-2" /> Edit Room
                      </button>
                      <button className="w-full flex items-center px-4 py-2 hover:bg-cyber-border text-cyber-red" onClick={handleDeleteRoom} type="button">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Room
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {activeChatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        msg.type === "system"
                          ? "w-full text-center"
                          : msg.senderId === currentUser?.id
                            ? "bg-cyber-blue text-cyber-dark"
                            : "bg-cyber-border text-cyber-blue"
                      } rounded-lg p-3`}
                    >
                      {msg.type === "system" ? (
                        <div className="flex items-center justify-center text-xs text-cyber-green">
                          <Shield className="h-3 w-3 mr-1" />
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          {msg.senderId !== currentUser?.id && (
                            <div className="text-xs font-medium mb-1 text-cyber-green">
                              {msg.sender}
                            </div>
                          )}
                          <div className="text-sm">{msg.content}</div>
                          {/* File download/copy buttons for file messages */}
                          {msg.type === "file" && msg.metadata && (
                            <div className="flex space-x-2 mt-1">
                              <button
                                className="p-1 text-cyber-blue hover:text-cyber-green"
                                title="Download File"
                                type="button"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1 text-cyber-blue hover:text-cyber-green"
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                title="Copy Filename"
                                type="button"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <div
                            className={`flex items-center justify-between mt-1 text-xs ${
                              msg.senderId === currentUser?.id
                                ? "text-cyber-darker"
                                : "text-gray-400"
                            }`}
                          >
                            <span>{formatTime(msg.timestamp)}</span>
                            <div className="flex items-center space-x-1">
                              {msg.encrypted && <Lock className="h-3 w-3" />}
                              {msg.senderId === currentUser?.id && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-cyber-border bg-cyber-gray">
              <div className="flex items-center space-x-2">
                {/* File Attach Button */}
                <button
                  className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                />
                {/* Emoji Picker Button */}
                <button
                  className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  type="button"
                  title="Emoji picker"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-14 left-0 z-10 bg-white border rounded shadow-lg p-4">
                    {/* Simple emoji picker for demo */}
                    <button className="p-1 text-xl" type="button" onClick={() => { setMessage((m) => m + "😃"); setShowEmojiPicker(false); }}>😃</button>
                    <button className="p-1 text-xl" type="button" onClick={() => { setMessage((m) => m + "👍"); setShowEmojiPicker(false); }}>👍</button>
                    <button className="p-1 text-xl" type="button" onClick={() => { setMessage((m) => m + "🔥"); setShowEmojiPicker(false); }}>🔥</button>
                  </div>
                )}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type an encrypted message..."
                    className="cyber-input w-full pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyber-green" />
                </div>
                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="cyber-button p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  title="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
                {/* Call Buttons */}
                <button
                  className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                  type="button"
                  title="Voice Call"
                  onClick={() => alert("Voice call started!")}
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                  type="button"
                  title="Video Call"
                  onClick={() => alert("Video call started!")}
                >
                  <Video className="h-4 w-4" />
                </button>
                {/* Room Settings */}
                <button
                  className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                  type="button"
                  title="Room Settings"
                  onClick={() => setShowRoomSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-cyber-blue mb-2">
                Select a Conversation
              </h3>
              <p className="text-gray-400">
                Choose a chat room to start secure communication
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg min-w-[320px]">
            <h2 className="text-lg font-bold mb-2">Create Chat Room</h2>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className="cyber-input w-full mb-3"
            />
            <div className="flex space-x-2">
              <button className="cyber-button" onClick={handleCreateRoom} type="button">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </button>
              <button className="cyber-button" onClick={() => setShowCreateRoom(false)} type="button">
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg min-w-[320px]">
            <h2 className="text-lg font-bold mb-2">Edit Room</h2>
            <input
              type="text"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="Room name"
              className="cyber-input w-full mb-3"
            />
            <div className="flex space-x-2">
              <button className="cyber-button" onClick={handleEditRoomSave} type="button">
                <CheckCircle className="h-4 w-4 mr-1" />
                Save
              </button>
              <button className="cyber-button" onClick={() => setShowRoomSettings(false)} type="button">
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUserProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cyber-gray rounded-lg p-6 w-96 max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyber-blue">User Profile</h3>
              <button
                onClick={() => setShowUserProfile(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {selectedUserProfile.firstName?.[0] || 'U'}{selectedUserProfile.lastName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-cyber-gray ${
                    selectedUserProfile.isOnline ? 'bg-cyber-green' : 'bg-gray-500'
                  }`} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-cyber-blue">
                    {selectedUserProfile.firstName} {selectedUserProfile.lastName}
                  </h4>
                  <p className="text-gray-400">@{selectedUserProfile.username}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUserProfile.role === 'admin' ? 'bg-cyber-red text-white' :
                      selectedUserProfile.role === 'enterprise' ? 'bg-cyber-purple text-white' :
                      selectedUserProfile.role === 'pro' ? 'bg-cyber-blue text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {selectedUserProfile.role?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedUserProfile.isOnline ? 'Online' : `Last seen ${formatLastActivity(selectedUserProfile.lastActive)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-cyber-blue">{selectedUserProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Department</label>
                  <p className="text-cyber-blue">{selectedUserProfile.department}</p>
                </div>
                {selectedUserProfile.specializations && selectedUserProfile.specializations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Specializations</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedUserProfile.specializations.map((spec: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-cyber-border text-cyber-blue text-xs rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Member Since</label>
                  <p className="text-cyber-blue">
                    {selectedUserProfile.joinDate ? new Date(selectedUserProfile.joinDate).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleStartPrivateChat(selectedUserProfile)}
                  className="flex-1 cyber-button bg-cyber-blue border-cyber-blue text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </button>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="cyber-button"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}