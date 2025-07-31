"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  User,
  Camera,
  Edit3,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Building,
  Award,
  Activity,
  Clock,
  MessageCircle,
  FileText,
  Target,
  TrendingUp,
  BarChart3,
  Users,
  Shield,
  Star,
  Badge,
  Upload,
} from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";

interface ProfileProps {
  user: any;
}

export default function Profile({ user }: ProfileProps) {
  const { updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    department: user?.department || "",
    specializations: user?.specializations || [],
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "security", label: "Security Log", icon: Shield },
  ];

  const specializations = [
    "Network Security",
    "Incident Response",
    "Malware Analysis",
    "Digital Forensics",
    "Penetration Testing",
    "OSINT",
    "Cryptography",
    "Threat Intelligence",
    "Cloud Security",
    "IoT Security",
    "Mobile Security",
    "Web Application Security",
  ];

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleSpecializationToggle = (spec: string) => {
    setEditData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s: string) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start space-x-6">
        <div className="relative">
          <div className="w-32 h-32 bg-cyber-blue rounded-full flex items-center justify-center text-4xl font-bold text-cyber-dark">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt="Avatar"
                width={128}
                height={128}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-cyber-gray border border-cyber-border rounded-full hover:bg-cyber-border transition-colors">
            <Camera className="h-4 w-4 text-cyber-blue" />
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-cyber-blue">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "Anonymous User"}
              </h1>
              <div className="flex items-center space-x-4 text-gray-400 mt-1">
                <span>@{user?.username}</span>
                <span
                  className={`flex items-center ${user?.isOnline ? "text-cyber-green" : "text-gray-500"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-1 ${user?.isOnline ? "bg-cyber-green" : "bg-gray-500"}`}
                  />
                  {user?.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="cyber-button flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail className="h-4 w-4 text-cyber-blue" />
              <span>{user?.email || "No email provided"}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Building className="h-4 w-4 text-cyber-blue" />
              <span>{user?.department || "No department"}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Calendar className="h-4 w-4 text-cyber-blue" />
              <span>
                Joined{" "}
                {user?.joinDate
                  ? new Date(user.joinDate).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock className="h-4 w-4 text-cyber-blue" />
              <span>
                Last active{" "}
                {user?.lastActive
                  ? new Date(user.lastActive).toLocaleString()
                  : "Unknown"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user?.role === "admin"
                  ? "bg-cyber-red text-white"
                  : user?.role === "enterprise"
                    ? "bg-cyber-purple text-white"
                    : user?.role === "pro"
                      ? "bg-cyber-blue text-white"
                      : "bg-gray-600 text-white"
              }`}
            >
              <Badge className="h-3 w-3 mr-1" />
              {user?.role?.toUpperCase() || "FREE"} TIER
            </span>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      {isEditing ? (
        <div className="cyber-panel">
          <h3 className="text-lg font-medium text-cyber-blue mb-4">
            Edit Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                First Name
              </label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="cyber-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="cyber-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Email
              </label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="cyber-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Department
              </label>
              <input
                type="text"
                value={editData.department}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                className="cyber-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Location
              </label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="cyber-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="cyber-input w-full"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Bio
            </label>
            <textarea
              value={editData.bio}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="cyber-input w-full h-24 resize-none"
              placeholder="Tell us about yourself and your expertise..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-cyber-blue mb-3">
              Specializations
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => handleSpecializationToggle(spec)}
                  className={`p-2 rounded text-xs font-medium transition-colors ${
                    editData.specializations.includes(spec)
                      ? "bg-cyber-blue text-white"
                      : "bg-cyber-border text-gray-400 hover:bg-cyber-blue hover:text-white"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="cyber-button bg-cyber-green border-cyber-green text-white"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="cyber-button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Bio Section */}
          {user?.bio && (
            <div className="cyber-panel">
              <h3 className="text-lg font-medium text-cyber-blue mb-3">
                About
              </h3>
              <p className="text-gray-300 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {user?.specializations?.length > 0 && (
            <div className="cyber-panel">
              <h3 className="text-lg font-medium text-cyber-blue mb-3">
                Specializations
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.specializations.map((spec: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cyber-blue bg-opacity-20 border border-cyber-blue rounded-full text-xs font-medium text-cyber-blue"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-panel text-center">
          <MessageCircle className="h-8 w-8 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-green">
            {user?.statistics?.chatMessages || 0}
          </div>
          <div className="text-sm text-gray-400">Messages Sent</div>
        </div>
        <div className="cyber-panel text-center">
          <FileText className="h-8 w-8 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-green">
            {user?.statistics?.filesProcessed || 0}
          </div>
          <div className="text-sm text-gray-400">Files Processed</div>
        </div>
        <div className="cyber-panel text-center">
          <Target className="h-8 w-8 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-green">
            {user?.statistics?.threatsAnalyzed || 0}
          </div>
          <div className="text-sm text-gray-400">Threats Analyzed</div>
        </div>
      </div>

      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            {
              type: "chat",
              desc: "Sent message in Red Team Alpha",
              time: "2 minutes ago",
            },
            {
              type: "analysis",
              desc: "Analyzed suspicious file hash",
              time: "15 minutes ago",
            },
            {
              type: "threat",
              desc: "Reviewed critical threat alert",
              time: "1 hour ago",
            },
            {
              type: "login",
              desc: "Logged in from New York, US",
              time: "3 hours ago",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-cyber-border rounded"
            >
              <div className="w-2 h-2 bg-cyber-green rounded-full"></div>
              <div className="flex-1">
                <div className="text-cyber-blue">{activity.desc}</div>
                <div className="text-xs text-gray-400">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Logins",
            value: user?.statistics?.totalLogins || 0,
            icon: Clock,
          },
          {
            label: "Session Time",
            value: `${Math.floor((user?.statistics?.sessionDuration || 0) / 60)}h`,
            icon: Activity,
          },
          {
            label: "Tools Used",
            value: user?.statistics?.toolsUsed || 0,
            icon: Target,
          },
          { label: "Success Rate", value: "94%", icon: TrendingUp },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="cyber-panel text-center">
              <Icon className="h-6 w-6 text-cyber-blue mx-auto mb-2" />
              <div className="text-xl font-bold text-cyber-green">
                {stat.value}
              </div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Performance Overview
        </h3>
        <div className="space-y-4">
          {[
            { label: "Threat Detection", percentage: 92 },
            { label: "Analysis Accuracy", percentage: 89 },
            { label: "Response Time", percentage: 76 },
            { label: "Team Collaboration", percentage: 94 },
          ].map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cyber-blue">{metric.label}</span>
                <span className="text-cyber-green">{metric.percentage}%</span>
              </div>
              <div className="w-full bg-cyber-border rounded-full h-2">
                <div
                  className="bg-cyber-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metric.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "First Analysis",
            desc: "Completed your first threat analysis",
            earned: true,
            date: "2024-01-15",
          },
          {
            title: "Team Player",
            desc: "Participated in 10 team operations",
            earned: true,
            date: "2024-02-20",
          },
          {
            title: "Threat Hunter",
            desc: "Analyzed 100 potential threats",
            earned: true,
            date: "2024-03-10",
          },
          {
            title: "Speed Demon",
            desc: "Response time under 5 minutes",
            earned: false,
            progress: 75,
          },
          {
            title: "Mentor",
            desc: "Helped train 5 new team members",
            earned: false,
            progress: 60,
          },
          {
            title: "Elite Analyst",
            desc: "Maintain 95% accuracy for 30 days",
            earned: false,
            progress: 42,
          },
        ].map((achievement, index) => (
          <div
            key={index}
            className={`cyber-panel ${achievement.earned ? "border-cyber-green" : "border-gray-600"}`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${achievement.earned ? "bg-cyber-green" : "bg-gray-600"}`}
              >
                <Star className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4
                  className={`font-medium ${achievement.earned ? "text-cyber-green" : "text-gray-400"}`}
                >
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{achievement.desc}</p>
                {achievement.earned && achievement.date && (
                  <p className="text-xs text-cyber-green mt-2">
                    Earned on {achievement.date}
                  </p>
                )}
                {!achievement.earned && achievement.progress && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-cyber-blue">
                        {achievement.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-cyber-border rounded-full h-1">
                      <div
                        className="bg-cyber-blue h-1 rounded-full"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityLog = () => (
    <div className="space-y-6">
      <div className="cyber-panel">
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Recent Security Events
        </h3>
        <div className="space-y-3">
          {[
            {
              type: "login",
              desc: "Successful login from New York, US",
              time: "2024-01-20 14:30",
              status: "success",
            },
            {
              type: "password",
              desc: "Password changed successfully",
              time: "2024-01-18 09:15",
              status: "success",
            },
            {
              type: "login",
              desc: "Failed login attempt detected",
              time: "2024-01-15 22:45",
              status: "warning",
            },
            {
              type: "device",
              desc: "New device registered: Chrome/MacOS",
              time: "2024-01-10 16:20",
              status: "info",
            },
          ].map((event, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-cyber-border rounded"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  event.status === "success"
                    ? "bg-cyber-green"
                    : event.status === "warning"
                      ? "bg-yellow-400"
                      : "bg-cyber-blue"
                }`}
              ></div>
              <div className="flex-1">
                <div className="text-cyber-blue">{event.desc}</div>
                <div className="text-xs text-gray-400">{event.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cyber-border bg-cyber-gray">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-cyber-blue" />
          <div>
            <h2 className="text-2xl font-bold text-cyber-blue">User Profile</h2>
            <p className="text-gray-400">
              Manage your profile and view your activity
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Profile Navigation */}
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

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && renderOverview()}
              {activeTab === "activity" && renderActivity()}
              {activeTab === "statistics" && renderStatistics()}
              {activeTab === "achievements" && renderAchievements()}
              {activeTab === "security" && renderSecurityLog()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
