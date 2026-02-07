"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  MessageCircle,
  FileText,
  Users,
  Search,
  Settings as SettingsIcon,
  Terminal,
  Eye,
  AlertTriangle,
  Zap,
  Database,
  User,
  LogOut,
} from "lucide-react";

import AuthForm from "./components/AuthForm";
import ChatInterface from "./components/ChatInterface";
import ToolsPanel from "./components/ToolsPanel";
import FileVault from "./components/FileVault";
import ThreatFeed from "./components/ThreatFeed";
import WarRoom from "./components/WarRoom";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import NotificationCenter from "./components/NotificationCenter";
import AdminPanel from "./components/AdminPanel";
import HydrationWrapper from "./components/HydrationWrapper";
import AurexLogo from "./components/AurexLogo";
import { useAuthStore } from "../lib/stores/authStore";
import { useAppStore } from "../lib/stores/appStore";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize app");
    }
  }, []);

  // Early return for SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-cyber-blue text-xl animate-pulse">
          Loading CyberSecChat...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-cyber-red text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <HydrationWrapper>
      <AppContent />
    </HydrationWrapper>
  );
}

function AppContent() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { currentView, setCurrentView } = useAppStore();

  const handleLogin = () => {
    // The auth state is managed by Zustand store and will automatically
    // trigger re-render when isAuthenticated changes
  };

  const baseNavigation = [
    {
      id: "chat",
      icon: MessageCircle,
      label: "Secure Communications",
      description: "End-to-end encrypted messaging",
    },
    {
      id: "vault",
      icon: Database,
      label: "Digital Vault",
      description: "Encrypted file storage & analysis",
    },
    {
      id: "tools",
      icon: Terminal,
      label: "Security Toolkit",
      description: "Forensics & penetration testing",
    },
    {
      id: "intel",
      icon: Eye,
      label: "Threat Intelligence",
      description: "Real-time security intelligence",
    },
    {
      id: "warroom",
      icon: Users,
      label: "Command Center",
      description: "Incident response & collaboration",
    },
    {
      id: "profile",
      icon: User,
      label: "Operator Profile",
      description: "Account & activity monitoring",
    },
    {
      id: "settings",
      icon: SettingsIcon,
      label: "System Config",
      description: "Platform configuration",
    },
  ];

    const adminNavigation = {
    id: "admin",
    icon: Shield,
    label: "Command Control",
    description: "System administration & monitoring",
  };

  const navigation =
    user?.role === "admin"
      ? [...baseNavigation, adminNavigation]
      : baseNavigation;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
                        <div className="flex flex-col items-center justify-center mb-4">
              <AurexLogo size="lg" animated={true} showText={true} />
            </div>
            <p className="text-cyber-green text-sm text-center">
              Advanced Security Platform • Threat Intelligence • Digital Forensics
            </p>
            <div className="flex items-center justify-center mt-2 text-xs text-gray-400">
              <Lock className="h-3 w-3 mr-1" />
              <span>Enterprise-Grade Security</span>
            </div>
          </motion.div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-cyber-gray border-r border-cyber-border flex flex-col"
      >
                {/* Header */}
        <div className="p-4 border-b border-cyber-border">
          <div className="flex items-center justify-center mb-4">
            <AurexLogo size="sm" animated={true} showText={true} />
          </div>

          {/* User Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyber-blue rounded-full flex items-center justify-center">
              <span className="text-cyber-dark font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <div className="text-cyber-blue text-sm font-medium">
                {user?.username || "Anonymous"}
              </div>
                            <div className="flex items-center">
                <div className="w-2 h-2 bg-cyber-green rounded-full mr-1"></div>
                <span className="text-cyber-green text-xs">
                  Active • {user?.role === 'admin' ? 'Command' : user?.role === 'enterprise' ? 'Elite' : user?.role === 'pro' ? 'Professional' : 'Operator'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  currentView === item.id
                    ? "bg-cyber-blue text-cyber-dark shadow-cyber"
                    : "text-cyber-blue hover:bg-cyber-border hover:shadow-cyber"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div
                    className={`text-xs ${
                      currentView === item.id
                        ? "text-cyber-darker"
                        : "text-gray-400"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Status Bar */}
        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <div className="flex items-center">
              <Zap className="h-3 w-3 mr-1 text-cyber-green" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 text-cyber-red" />
                <span>Secure Mode</span>
              </div>
              <NotificationCenter />
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-white transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {currentView === "chat" && <ChatInterface user={user} />}
            {currentView === "vault" && <FileVault user={user} />}
            {currentView === "tools" && <ToolsPanel user={user} />}
            {currentView === "intel" && <ThreatFeed user={user} />}
            {currentView === "warroom" && <WarRoom user={user} />}
            {currentView === "profile" && <Profile user={user} />}
            {currentView === "settings" && <Settings user={user} />}
            {currentView === "admin" && <AdminPanel user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
