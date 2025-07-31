"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  Settings,
  BarChart3,
  UserPlus,
  UserMinus,
  Edit,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";
import { useAppStore } from "../../lib/stores/appStore";

interface AdminPanelProps {
  user: any;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const { users, removeUser } = useAuthStore();
  const { notifications, threatAlerts } = useAppStore();
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "threats", label: "Threats", icon: AlertTriangle },
    { id: "settings", label: "System", icon: Settings },
  ];

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-cyber-blue">User Management</h3>
        <button className="cyber-button flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((u) => (
          <div key={u.id} className="cyber-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-cyber-blue rounded-full flex items-center justify-center">
                  <span className="text-cyber-dark font-bold text-sm">
                    {u.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-cyber-blue">
                    {u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : u.username}
                  </div>
                  <div className="text-sm text-gray-400">
                    {u.email} • {u.role.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last active: {u.lastActive.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${u.isOnline ? "bg-cyber-green" : "bg-gray-500"}`}
                />
                <span className="text-xs text-gray-400">
                  {u.isOnline ? "Online" : "Offline"}
                </span>
                <button className="p-2 text-gray-400 hover:text-cyber-blue">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-cyber-blue">
                  <Eye className="h-4 w-4" />
                </button>
                {u.id !== user?.id && (
                  <button
                    onClick={() => removeUser(u.id)}
                    className="p-2 text-gray-400 hover:text-cyber-red"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-panel text-center">
          <Shield className="h-8 w-8 text-cyber-green mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-green">98%</div>
          <div className="text-sm text-gray-400">Security Score</div>
        </div>
        <div className="cyber-panel text-center">
          <AlertTriangle className="h-8 w-8 text-cyber-red mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-red">
            {threatAlerts.length}
          </div>
          <div className="text-sm text-gray-400">Active Threats</div>
        </div>
        <div className="cyber-panel text-center">
          <Activity className="h-8 w-8 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-blue">
            {users.filter((u) => u.isOnline).length}
          </div>
          <div className="text-sm text-gray-400">Active Sessions</div>
        </div>
      </div>

      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Security Events
        </h3>
        <div className="space-y-3">
          {[
            {
              type: "success",
              event: "All systems operational",
              time: "2 minutes ago",
            },
            {
              type: "warning",
              event: "Failed login attempt detected",
              time: "15 minutes ago",
            },
            {
              type: "info",
              event: "Security scan completed",
              time: "1 hour ago",
            },
            {
              type: "success",
              event: "User permissions updated",
              time: "2 hours ago",
            },
          ].map((event, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-cyber-border rounded"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  event.type === "success"
                    ? "bg-cyber-green"
                    : event.type === "warning"
                      ? "bg-yellow-400"
                      : "bg-cyber-blue"
                }`}
              />
              <div className="flex-1">
                <div className="text-cyber-blue">{event.event}</div>
                <div className="text-xs text-gray-400">{event.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          System Activity
        </h3>
        <div className="space-y-3">
          {[
            {
              user: "admin",
              action: "Created new user account",
              time: "5 minutes ago",
            },
            {
              user: "alice.johnson",
              action: "Analyzed suspicious file",
              time: "12 minutes ago",
            },
            {
              user: "bob.smith",
              action: "Joined Red Team Alpha channel",
              time: "18 minutes ago",
            },
            {
              user: "dr.chen",
              action: "Updated threat intelligence feed",
              time: "25 minutes ago",
            },
            {
              user: "system",
              action: "Automated security scan completed",
              time: "1 hour ago",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-cyber-border rounded"
            >
              <div>
                <div className="text-cyber-blue">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}
                </div>
                <div className="text-xs text-gray-400">{activity.time}</div>
              </div>
              <button className="text-gray-400 hover:text-cyber-blue">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderThreats = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-cyber-blue">
          Threat Management
        </h3>
        <button className="cyber-button flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Feed</span>
        </button>
      </div>

      <div className="grid gap-4">
        {threatAlerts.slice(0, 10).map((threat) => (
          <div key={threat.id} className="cyber-panel">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      threat.severity === "critical"
                        ? "bg-cyber-red text-white"
                        : threat.severity === "high"
                          ? "bg-orange-400 text-white"
                          : threat.severity === "medium"
                            ? "bg-yellow-400 text-black"
                            : "bg-cyber-green text-white"
                    }`}
                  >
                    {threat.severity.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-400">
                    {threat.category}
                  </span>
                </div>
                <h4 className="font-medium text-cyber-blue mb-1">
                  {threat.title}
                </h4>
                <p className="text-sm text-gray-400 mb-2">
                  {threat.description}
                </p>
                <div className="text-xs text-gray-500">
                  {threat.timestamp.toLocaleString()} • Source: {threat.source}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    threat.status === "new"
                      ? "bg-cyber-blue text-white"
                      : threat.status === "investigating"
                        ? "bg-yellow-400 text-black"
                        : threat.status === "resolved"
                          ? "bg-cyber-green text-white"
                          : "bg-gray-600 text-white"
                  }`}
                >
                  {threat.status.replace("-", " ").toUpperCase()}
                </span>
                <button className="text-gray-400 hover:text-cyber-blue">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          System Configuration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">
                Maintenance Mode
              </div>
              <div className="text-sm text-gray-400">
                Enable system maintenance mode
              </div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">
                Auto Threat Detection
              </div>
              <div className="text-sm text-gray-400">
                Automatically scan for new threats
              </div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-cyber-green">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">Debug Mode</div>
              <div className="text-sm text-gray-400">
                Enable detailed system logging
              </div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Data Management
        </h3>
        <div className="space-y-3">
          <button className="cyber-button w-full flex items-center justify-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export System Logs</span>
          </button>
          <button className="cyber-button w-full flex items-center justify-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export User Data</span>
          </button>
          <button className="cyber-button w-full flex items-center justify-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Generate Analytics Report</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Only allow admins to access
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-16 w-16 text-cyber-red mx-auto mb-4" />
          <h3 className="text-xl font-medium text-cyber-red mb-2">
            Access Denied
          </h3>
          <p className="text-gray-400">
            You need administrator privileges to access this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cyber-border bg-cyber-gray">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-cyber-red" />
          <div>
            <h2 className="text-2xl font-bold text-cyber-blue">Admin Panel</h2>
            <p className="text-gray-400">
              System administration and user management
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Admin Navigation */}
        <div className="w-64 bg-cyber-gray border-r border-cyber-border">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-cyber-blue text-cyber-dark"
                      : "text-cyber-blue hover:bg-cyber-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "users" && renderUsers()}
            {activeTab === "security" && renderSecurity()}
            {activeTab === "activity" && renderActivity()}
            {activeTab === "threats" && renderThreats()}
            {activeTab === "settings" && renderSettings()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
