"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Shield,
  MessageCircle,
  Settings,
  TrendingUp,
  Clock,
  Filter,
  MailOpen,
} from "lucide-react";
import { useAppStore } from "../../lib/stores/appStore";

export default function NotificationCenter() {
  const {
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    addNotification,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "unread" | "threat" | "message" | "system"
  >("all");

  // Demo notification generator
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance every 10 seconds
        const types = ["threat", "message", "system", "security"] as const;
        const type = types[Math.floor(Math.random() * types.length)];

        const messages = {
          threat: [
            "New critical threat detected in network traffic",
            "Suspicious file hash identified in uploads",
            "Anomalous login attempt from unknown location",
            "Potential malware signature found in email attachment",
          ],
          message: [
            "New message in Red Team Alpha channel",
            "You were mentioned in Blue Team Defense",
            "File shared in Forensics Lab group",
            "Direct message from Dr. Sarah Chen",
          ],
          system: [
            "System maintenance scheduled for tonight",
            "New forensics tools available in toolkit",
            "Platform updated to version 2.1.3",
            "Weekly security report is ready",
          ],
          security: [
            "Password will expire in 7 days",
            "New device logged into your account",
            "Security scan completed successfully",
            "Two-factor authentication enabled",
          ],
        };

        const priorities = {
          threat: ["high", "critical"],
          message: ["low", "medium"],
          system: ["low", "medium"],
          security: ["medium", "high"],
        };

        const randomMessage =
          messages[type][Math.floor(Math.random() * messages[type].length)];
        const randomPriority = priorities[type][
          Math.floor(Math.random() * priorities[type].length)
        ] as "low" | "medium" | "high" | "critical";

        addNotification({
          type,
          title:
            type === "threat"
              ? "Security Alert"
              : type === "message"
                ? "New Message"
                : type === "security"
                  ? "Security Notice"
                  : "System Update",
          message: randomMessage,
          priority: randomPriority,
          read: false,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case "threat":
        return <AlertTriangle className="h-4 w-4 text-cyber-red" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-cyber-blue" />;
      case "security":
        return <Shield className="h-4 w-4 text-cyber-green" />;
      case "system":
        return <Settings className="h-4 w-4 text-cyber-purple" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-l-cyber-red bg-cyber-red bg-opacity-10";
      case "high":
        return "border-l-orange-400 bg-orange-400 bg-opacity-10";
      case "medium":
        return "border-l-yellow-400 bg-yellow-400 bg-opacity-10";
      case "low":
        return "border-l-cyber-green bg-cyber-green bg-opacity-10";
      default:
        return "border-l-gray-400 bg-gray-400 bg-opacity-10";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    return notification.type === filter;
  });

  const formatTimeAgo = (date: Date | undefined) => {
    if (!date) return "Unknown";

    try {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
      return `${Math.floor(minutes / 1440)}d ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-cyber-blue rounded transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-cyber-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
          >
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-4 top-16 w-96 bg-cyber-gray border border-cyber-border rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-cyber-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-cyber-blue">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadNotifications > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-gray-400 hover:text-cyber-blue"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-cyber-blue"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-1 text-xs">
                  {[
                    { id: "all", label: "All" },
                    { id: "unread", label: "Unread" },
                    { id: "threat", label: "Threats" },
                    { id: "message", label: "Messages" },
                    { id: "system", label: "System" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as any)}
                      className={`px-2 py-1 rounded transition-colors ${
                        filter === tab.id
                          ? "bg-cyber-blue text-cyber-dark"
                          : "text-gray-400 hover:text-cyber-blue"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">
                      {filter === "unread"
                        ? "No unread notifications"
                        : "No notifications"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-3 mb-2 rounded-lg border-l-4 cursor-pointer transition-all ${getPriorityColor(
                            notification.priority,
                          )} ${
                            notification.read ? "opacity-70" : ""
                          } hover:bg-opacity-20`}
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-cyber-blue truncate">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-400">
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-cyber-blue rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-300 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    notification.priority === "critical"
                                      ? "bg-cyber-red text-white"
                                      : notification.priority === "high"
                                        ? "bg-orange-400 text-white"
                                        : notification.priority === "medium"
                                          ? "bg-yellow-400 text-black"
                                          : "bg-cyber-green text-white"
                                  }`}
                                >
                                  {notification.priority.toUpperCase()}
                                </span>
                                {notification.actionUrl && (
                                  <button className="text-xs text-cyber-blue hover:underline">
                                    View Details
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-cyber-border text-center">
                  <button className="text-sm text-cyber-blue hover:underline">
                    View All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
