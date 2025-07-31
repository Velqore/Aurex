"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Target,
  CheckSquare,
  Square,
  MessageSquare,
  FileText,
  User,
  Settings,
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";

interface WarRoomProps {
  user: any;
}

interface Operation {
  id: string;
  name: string;
  type: "red-team" | "blue-team" | "purple-team" | "incident-response";
  status: "planning" | "active" | "completed" | "paused";
  priority: "low" | "medium" | "high" | "critical";
  startDate: Date;
  endDate?: Date;
  members: string[];
  description: string;
  objectives: string[];
  progress: number;
  lastActivity: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  createdAt: Date;
}

export default function WarRoom({ user }: WarRoomProps) {
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "timeline" | "members"
  >("overview");
  const [showCreateOperation, setShowCreateOperation] = useState(false);

  // Mock operations data
  const [operations] = useState<Operation[]>([
    {
      id: "1",
      name: "Operation Shadow Network",
      type: "red-team",
      status: "active",
      priority: "high",
      startDate: new Date(Date.now() - 172800000),
      members: ["Alice Johnson", "Bob Smith", "Charlie Brown"],
      description:
        "Penetration testing of corporate network infrastructure to identify vulnerabilities and improve security posture.",
      objectives: [
        "Gain initial access to internal network",
        "Escalate privileges on domain controllers",
        "Exfiltrate sensitive data samples",
        "Document security findings",
      ],
      progress: 65,
      lastActivity: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      name: "Incident Response: Malware Outbreak",
      type: "incident-response",
      status: "active",
      priority: "critical",
      startDate: new Date(Date.now() - 86400000),
      members: ["Dr. Sarah Chen", "Mike Wilson", "Lisa Davis", "Tom Anderson"],
      description:
        "Responding to widespread malware infection across multiple departments. Containing spread and analyzing impact.",
      objectives: [
        "Contain malware spread",
        "Identify patient zero",
        "Analyze malware capabilities",
        "Restore affected systems",
        "Implement prevention measures",
      ],
      progress: 40,
      lastActivity: new Date(Date.now() - 900000),
    },
    {
      id: "3",
      name: "Blue Team Defense Exercise",
      type: "blue-team",
      status: "planning",
      priority: "medium",
      startDate: new Date(Date.now() + 259200000),
      members: ["Emma White", "James Green", "Sofia Rodriguez"],
      description:
        "Comprehensive defense exercise to test incident response capabilities and security monitoring systems.",
      objectives: [
        "Test SIEM detection rules",
        "Validate incident response procedures",
        "Assess team coordination",
        "Update playbooks",
      ],
      progress: 15,
      lastActivity: new Date(Date.now() - 7200000),
    },
  ]);

  // Mock tasks data
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Reconnaissance phase completion",
      description: "Complete network mapping and service enumeration",
      assignee: "Alice Johnson",
      status: "done",
      priority: "high",
      dueDate: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 172800000),
    },
    {
      id: "2",
      title: "Vulnerability assessment",
      description: "Identify and catalog potential attack vectors",
      assignee: "Bob Smith",
      status: "in-progress",
      priority: "high",
      dueDate: new Date(Date.now() + 43200000),
      createdAt: new Date(Date.now() - 129600000),
    },
    {
      id: "3",
      title: "Payload development",
      description: "Develop custom exploits for identified vulnerabilities",
      assignee: "Charlie Brown",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 86400000),
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case "red-team":
        return "text-cyber-red border-cyber-red";
      case "blue-team":
        return "text-cyber-blue border-cyber-blue";
      case "purple-team":
        return "text-cyber-purple border-cyber-purple";
      case "incident-response":
        return "text-orange-400 border-orange-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-cyber-green";
      case "planning":
        return "text-cyber-blue";
      case "completed":
        return "text-gray-400";
      case "paused":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-cyber-red";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-cyber-green";
      default:
        return "text-gray-400";
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckSquare className="h-4 w-4 text-cyber-green" />;
      case "in-progress":
        return (
          <div className="h-4 w-4 border-2 border-cyber-blue rounded bg-cyber-blue bg-opacity-50" />
        );
      default:
        return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const selectedOperation = operations.find((op) => op.id === activeOperation);

  return (
    <div className="flex h-full">
      {/* Operations Sidebar */}
      <div className="w-80 bg-cyber-gray border-r border-cyber-border flex flex-col">
        <div className="p-4 border-b border-cyber-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cyber-blue">War Room</h2>
            <button
              onClick={() => setShowCreateOperation(true)}
              className="cyber-button p-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Active operations and incidents
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {operations.map((operation) => (
            <motion.button
              key={operation.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveOperation(operation.id)}
              className={`w-full p-4 border-b border-cyber-border text-left transition-all ${
                activeOperation === operation.id
                  ? "bg-cyber-blue bg-opacity-20 border-cyber-blue"
                  : "hover:bg-cyber-border"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded border ${getOperationTypeColor(operation.type)}`}
                  >
                    {operation.type.replace("-", " ").toUpperCase()}
                  </span>
                  <span
                    className={`text-xs font-medium ${getStatusColor(operation.status)}`}
                  >
                    {operation.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-medium text-cyber-blue text-sm">
                  {operation.name}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{operation.members.length}</span>
                  </div>
                  <span className={getPriorityColor(operation.priority)}>
                    {operation.priority.toUpperCase()}
                  </span>
                </div>

                <div className="w-full bg-cyber-border rounded-full h-1.5">
                  <div
                    className="bg-cyber-green h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${operation.progress}%` }}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Last activity: {formatTimeAgo(operation.lastActivity)}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedOperation ? (
          <>
            {/* Operation Header */}
            <div className="p-6 border-b border-cyber-border bg-cyber-gray">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`text-sm px-3 py-1 rounded border ${getOperationTypeColor(selectedOperation.type)}`}
                    >
                      {selectedOperation.type.replace("-", " ").toUpperCase()}
                    </span>
                    <span
                      className={`text-sm font-medium ${getStatusColor(selectedOperation.status)}`}
                    >
                      {selectedOperation.status.toUpperCase()}
                    </span>
                    <span
                      className={`text-sm ${getPriorityColor(selectedOperation.priority)}`}
                    >
                      {selectedOperation.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-cyber-blue mb-2">
                    {selectedOperation.name}
                  </h1>
                  <p className="text-gray-400 max-w-2xl">
                    {selectedOperation.description}
                  </p>
                </div>
                <button className="cyber-button flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cyber-blue">
                    Progress
                  </span>
                  <span className="text-sm text-gray-400">
                    {selectedOperation.progress}% Complete
                  </span>
                </div>
                <div className="w-full bg-cyber-border rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedOperation.progress}%` }}
                    className="bg-cyber-green h-2 rounded-full"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-6">
                {["overview", "tasks", "timeline", "members"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "text-cyber-blue border-cyber-blue"
                        : "text-gray-400 border-transparent hover:text-cyber-blue"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Objectives */}
                      <div className="cyber-panel">
                        <h3 className="text-lg font-medium text-cyber-blue mb-4 flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Objectives
                        </h3>
                        <div className="space-y-3">
                          {selectedOperation.objectives.map(
                            (objective, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3"
                              >
                                <div className="w-6 h-6 bg-cyber-blue text-cyber-dark rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                  {index + 1}
                                </div>
                                <span className="text-gray-300 flex-1">
                                  {objective}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="cyber-panel">
                        <h3 className="text-lg font-medium text-cyber-blue mb-4 flex items-center">
                          <Activity className="h-5 w-5 mr-2" />
                          Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyber-green">
                              {selectedOperation.members.length}
                            </div>
                            <div className="text-sm text-gray-400">
                              Team Members
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyber-blue">
                              {tasks.length}
                            </div>
                            <div className="text-sm text-gray-400">
                              Total Tasks
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyber-purple">
                              {Math.floor(
                                (Date.now() -
                                  selectedOperation.startDate.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              Days Active
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {selectedOperation.priority === "critical"
                                ? "🔥"
                                : selectedOperation.priority === "high"
                                  ? "⚡"
                                  : selectedOperation.priority === "medium"
                                    ? "📋"
                                    : "📝"}
                            </div>
                            <div className="text-sm text-gray-400">
                              Priority
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "tasks" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-cyber-blue">
                          Task Board
                        </h3>
                        <button className="cyber-button flex items-center space-x-2">
                          <Plus className="h-4 w-4" />
                          <span>Add Task</span>
                        </button>
                      </div>

                      <div className="grid gap-4">
                        {tasks.map((task) => (
                          <div key={task.id} className="cyber-panel">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                {getTaskStatusIcon(task.status)}
                                <div className="flex-1">
                                  <h4 className="font-medium text-cyber-blue mb-1">
                                    {task.title}
                                  </h4>
                                  <p className="text-sm text-gray-400 mb-2">
                                    {task.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>Assigned to: {task.assignee}</span>
                                    {task.dueDate && (
                                      <span>
                                        Due: {task.dueDate.toLocaleDateString()}
                                      </span>
                                    )}
                                    <span
                                      className={getPriorityColor(
                                        task.priority,
                                      )}
                                    >
                                      {task.priority.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "timeline" && (
                    <div className="cyber-panel">
                      <h3 className="text-lg font-medium text-cyber-blue mb-4">
                        Operation Timeline
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-3 h-3 bg-cyber-green rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-cyber-blue">
                              Operation Started
                            </div>
                            <div className="text-sm text-gray-400">
                              {selectedOperation.startDate.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="w-3 h-3 bg-cyber-blue rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-cyber-blue">
                              Reconnaissance Completed
                            </div>
                            <div className="text-sm text-gray-400">
                              2 hours ago
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2"></div>
                          <div>
                            <div className="font-medium text-cyber-blue">
                              Vulnerability Assessment In Progress
                            </div>
                            <div className="text-sm text-gray-400">
                              Currently active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "members" && (
                    <div className="cyber-panel">
                      <h3 className="text-lg font-medium text-cyber-blue mb-4">
                        Team Members
                      </h3>
                      <div className="grid gap-4">
                        {selectedOperation.members.map((member, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4 p-3 bg-cyber-border rounded"
                          >
                            <div className="w-10 h-10 bg-cyber-blue rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-cyber-dark" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-cyber-blue">
                                {member}
                              </div>
                              <div className="text-sm text-gray-400">
                                {index === 0 ? "Team Lead" : "Security Analyst"}
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-cyber-green rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-cyber-blue mb-2">
                Select an Operation
              </h3>
              <p className="text-gray-400 mb-6">
                Choose an operation from the sidebar to view details and
                collaborate with your team
              </p>
              <button
                onClick={() => setShowCreateOperation(true)}
                className="cyber-button flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Operation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
