"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Eye,
  Monitor,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Globe,
  Database,
  AlertTriangle,
  CheckCircle,
  Moon,
  Sun,
  Palette,
  Crown,
  CreditCard,
  Info,
} from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";
import { useAppStore } from "../../lib/stores/appStore";
import SubscriptionManager from "./SubscriptionManager";

interface SettingsProps {
  user: any;
}

export default function Settings({ user }: SettingsProps) {
  const { updatePreferences, updateProfile } = useAuthStore();
  const { theme, setTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState("general");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    ...user?.preferences,
    theme: theme || user?.preferences?.theme || "cyber",
  });
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    department: user?.department || "",
    specializations: user?.specializations || [],
  });

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "subscription", label: "Subscription", icon: Crown },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "interface", label: "Interface", icon: Monitor },
    { id: "data", label: "Data & Export", icon: Database },
    { id: "about", label: "About", icon: Info },
  ];

  const handlePreferenceChange = (
    category: string,
    key: string,
    value: any,
  ) => {
    if (category === "theme" && key === "") {
      // Handle theme directly
      setPreferences((prev: any) => ({
        ...prev,
        theme: value,
      }));
      // Immediately apply theme changes
      setTheme(value);
    } else {
      // Handle nested preferences
      setPreferences((prev: any) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        },
      }));
    }

    setUnsavedChanges(true);
  };

  const handleProfileChange = (key: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePreferences(preferences);
      await updateProfile(profile);

      // Update theme in app store if it changed
      if (preferences.theme && preferences.theme !== theme) {
        setTheme(preferences.theme);
      }

      setUnsavedChanges(false);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

      console.log("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => handleProfileChange("firstName", e.target.value)}
              className="cyber-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => handleProfileChange("lastName", e.target.value)}
              className="cyber-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange("email", e.target.value)}
              className="cyber-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Department
            </label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) =>
                handleProfileChange("department", e.target.value)
              }
              className="cyber-input w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Account Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">Account Type</div>
              <div className="text-sm text-gray-400">
                Current subscription level
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                user?.role === "admin"
                  ? "bg-cyber-red text-white"
                  : user?.role === "enterprise"
                    ? "bg-cyber-purple text-white"
                    : user?.role === "pro"
                      ? "bg-cyber-blue text-white"
                      : "bg-gray-600 text-white"
              }`}
            >
              {user?.role?.toUpperCase() || "FREE"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">Member Since</div>
              <div className="text-sm text-gray-400">Account creation date</div>
            </div>
            <span className="text-cyber-green">
              {user?.joinDate
                ? new Date(user.joinDate).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </div>
              <div className="text-sm text-gray-400">
                Add an extra layer of security
              </div>
            </div>
            <button
              onClick={() =>
                handlePreferenceChange(
                  "security",
                  "twoFactorEnabled",
                  !preferences.security?.twoFactorEnabled,
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.security?.twoFactorEnabled
                  ? "bg-cyber-green"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.security?.twoFactorEnabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">Login Alerts</div>
              <div className="text-sm text-gray-400">
                Get notified of new login attempts
              </div>
            </div>
            <button
              onClick={() =>
                handlePreferenceChange(
                  "security",
                  "loginAlerts",
                  !preferences.security?.loginAlerts,
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.security?.loginAlerts
                  ? "bg-cyber-green"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.security?.loginAlerts
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <div className="font-medium text-cyber-blue mb-2">
              Session Timeout
            </div>
            <div className="text-sm text-gray-400 mb-3">
              Automatically log out after inactivity
            </div>
            <select
              value={preferences.security?.sessionTimeout || 30}
              onChange={(e) =>
                handlePreferenceChange(
                  "security",
                  "sessionTimeout",
                  parseInt(e.target.value),
                )
              }
              className="cyber-input w-full max-w-xs"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Password & Access
        </h3>
        <div className="space-y-4">
          <button className="cyber-button flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Change Password</span>
          </button>
          <button className="cyber-button flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Manage API Keys</span>
          </button>
          <button className="cyber-button flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Active Sessions</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "email",
              label: "Email Notifications",
              desc: "Receive notifications via email",
            },
            {
              key: "desktop",
              label: "Desktop Notifications",
              desc: "Show browser notifications",
            },
            {
              key: "threatAlerts",
              label: "Threat Alerts",
              desc: "Real-time security alerts",
            },
            {
              key: "chatMessages",
              label: "Chat Messages",
              desc: "New message notifications",
            },
            {
              key: "systemUpdates",
              label: "System Updates",
              desc: "Platform updates and maintenance",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-cyber-blue">{item.label}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
              <button
                onClick={() =>
                  handlePreferenceChange(
                    "notifications",
                    item.key,
                    !preferences.notifications?.[item.key],
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications?.[item.key]
                    ? "bg-cyber-green"
                    : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notifications?.[item.key]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Privacy Controls
        </h3>
        <div className="space-y-4">
          <div>
            <div className="font-medium text-cyber-blue mb-2">
              Profile Visibility
            </div>
            <div className="text-sm text-gray-400 mb-3">
              Who can see your profile information
            </div>
            <select
              value={preferences.privacy?.profileVisibility || "team"}
              onChange={(e) =>
                handlePreferenceChange(
                  "privacy",
                  "profileVisibility",
                  e.target.value,
                )
              }
              className="cyber-input w-full max-w-xs"
            >
              <option value="public">Public</option>
              <option value="team">Team Members Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">
                Activity Tracking
              </div>
              <div className="text-sm text-gray-400">
                Allow tracking of your activity for analytics
              </div>
            </div>
            <button
              onClick={() =>
                handlePreferenceChange(
                  "privacy",
                  "activityTracking",
                  !preferences.privacy?.activityTracking,
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.privacy?.activityTracking
                  ? "bg-cyber-green"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.privacy?.activityTracking
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-cyber-blue">Data Sharing</div>
              <div className="text-sm text-gray-400">
                Share anonymized data for platform improvement
              </div>
            </div>
            <button
              onClick={() =>
                handlePreferenceChange(
                  "privacy",
                  "dataSharing",
                  !preferences.privacy?.dataSharing,
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.privacy?.dataSharing
                  ? "bg-cyber-green"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.privacy?.dataSharing
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfaceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <div className="font-medium text-cyber-blue mb-2">Theme</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "cyber", label: "Cyber", icon: Palette },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "light", label: "Light", icon: Sun },
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() =>
                      handlePreferenceChange("theme", "", theme.value)
                    }
                    className={`p-3 rounded-lg border transition-all ${
                      preferences.theme === theme.value
                        ? "border-cyber-blue bg-cyber-blue bg-opacity-20"
                        : "border-cyber-border hover:border-cyber-blue"
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-cyber-blue" />
                    <div className="text-sm font-medium text-cyber-blue">
                      {theme.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-medium text-cyber-blue mb-2">Default View</div>
            <div className="text-sm text-gray-400 mb-3">
              Which section to show when you log in
            </div>
            <select
              value={preferences.interface?.defaultView || "chat"}
              onChange={(e) =>
                handlePreferenceChange(
                  "interface",
                  "defaultView",
                  e.target.value,
                )
              }
              className="cyber-input w-full max-w-xs"
            >
              <option value="chat">Secure Chat</option>
              <option value="vault">File Vault</option>
              <option value="tools">Forensics Kit</option>
              <option value="intel">Threat Intel</option>
              <option value="warroom">War Room</option>
            </select>
          </div>

          {[
            {
              key: "compactMode",
              label: "Compact Mode",
              desc: "Use smaller interface elements",
            },
            {
              key: "showTooltips",
              label: "Show Tooltips",
              desc: "Display helpful tooltips",
            },
            {
              key: "autoRefresh",
              label: "Auto Refresh",
              desc: "Automatically refresh data",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-cyber-blue">{item.label}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
              <button
                onClick={() =>
                  handlePreferenceChange(
                    "interface",
                    item.key,
                    !preferences.interface?.[item.key],
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.interface?.[item.key]
                    ? "bg-cyber-green"
                    : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.interface?.[item.key]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          Data Management
        </h3>
        <div className="space-y-4">
          <button className="cyber-button flex items-center space-x-2 w-full justify-center">
            <Download className="h-4 w-4" />
            <span>Export All Data</span>
          </button>

          <button className="cyber-button flex items-center space-x-2 w-full justify-center">
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>

          <button className="cyber-button flex items-center space-x-2 w-full justify-center">
            <RefreshCw className="h-4 w-4" />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-cyber-red mb-4">Danger Zone</h3>
        <div className="space-y-4 p-4 border border-cyber-red rounded-lg bg-cyber-red bg-opacity-10">
          <button className="cyber-button border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-white flex items-center space-x-2 w-full justify-center">
            <Trash2 className="h-4 w-4" />
            <span>Clear All Chat History</span>
          </button>

          <button className="cyber-button border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-white flex items-center space-x-2 w-full justify-center">
            <Trash2 className="h-4 w-4" />
            <span>Reset All Settings</span>
          </button>

          <button className="cyber-button border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-white flex items-center space-x-2 w-full justify-center">
            <AlertTriangle className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-cyber-blue mb-4">
          About AUREX
        </h3>
        <div className="space-y-6">
          {/* Company Information */}
          <div className="cyber-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-md font-semibold text-cyber-blue flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Company Information
              </h4>
              {/* Company Logo */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D560BAQEqsudrfYluXQ/company-logo_100_100/B56ZdTAnCdGsAQ-/0/1749444359355?e=1756944000&v=beta&t=p4rtXdZ1Hz20DNWbvAZ-9DjsGUqEVz4KcXtv8i15wA4" 
                    alt="RFCSINDIA - Rudra Forensics & CySecurity Pvt. Ltd. Logo"
                    className="w-16 h-16 rounded-lg border border-cyber-border object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyber-green rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-cyber-blue">Rudra Forensics & CySecurity Pvt. Ltd.( RFCSINDIA )</div>
                  <div className="text-xs text-gray-400">Cybersecurity Solutions</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="font-medium text-cyber-blue">Company:</span>
                <span className="ml-2">Rudra Forensics & CySecurity Pvt. Ltd.( RFCSINDIA )</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Application:</span>
                <span className="ml-2">AUREX Cybersecurity Platform</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Version:</span>
                <span className="ml-2">1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Description:</span>
                <span className="ml-2">Advanced Unified Platform for Cybersecurity and Forensics Experts,Ethical Hackers, and All Information Experts.</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Website:</span>
                <span className="ml-2">
                  <a 
                    href="https://www.linkedin.com/company/rudra-forensic-cysecurity-pvt-ltd/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyber-blue hover:text-cyber-light underline"
                  >
                    Company LinkedIn
                  </a>
                </span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Established:</span>
                <span className="ml-2">2024</span>
              </div>
            </div>
          </div>

          {/* Developer Information */}
          <div className="cyber-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-md font-semibold text-cyber-blue flex items-center">
                <User className="h-5 w-5 mr-2" />
                Developer Information
              </h4>
              {/* Developer Image */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D4E03AQGkhJOhREFXbA/profile-displayphoto-scale_200_200/B4EZerFMy5HcAg-/0/1750921959003?e=1756944000&v=beta&t=XQsFISoixw8sR5KnBA4ggA3I05lj98x2Z_2KAkIxhv4" 
                    alt="Mr.Ayush Tyagi - Lead Developer & Associate Director of Operations at RFCSINDIA"
                    className="w-16 h-16 rounded-full border-2 border-cyber-blue object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center">
                    <Key className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-cyber-blue">Mr.Ayush Tyagi</div>
                  <div className="text-xs text-gray-400">Lead Developer</div>
                  <div className="text-xs text-cyber-green">● Active</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="font-medium text-cyber-blue">Lead Developer:</span>
                <span className="ml-2">Mr.Ayush Tyagi</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">About:</span>
                <span className="ml-2">
                  <a 
                    href="https://www.linkedin.com/in/ayush-tyagi-96b3b7350/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyber-blue hover:text-cyber-light underline"
                  >
                    LinkedIn- Profile
                  </a>
                </span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Website:</span>
                <span className="ml-2">
                  <a 
                    href="https://linktr.ee/velqore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyber-blue hover:text-cyber-light underline"
                  >
                    Website
                  </a>
                </span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Development Year:</span>
                <span className="ml-2">2025</span>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div className="cyber-panel p-6">
            <h4 className="text-md font-semibold text-cyber-blue mb-3 flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Technical Stack
            </h4>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="font-medium text-cyber-blue">Frontend:</span>
                <span className="ml-2">Next.js 15, React 18, TypeScript</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Styling:</span>
                <span className="ml-2">Tailwind CSS, Framer Motion</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Terminal:</span>
                <span className="ml-2">XTerm.js with real Linux command execution</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Communication:</span>
                <span className="ml-2">Socket.IO WebSockets</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">Security:</span>
                <span className="ml-2">JWT Authentication, bcrypt, Rate Limiting</span>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="cyber-panel p-6">
            <h4 className="text-md font-semibold text-cyber-blue mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Key Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Real Linux Terminal</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Threat Intelligence Feed</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Secure Chat System</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>File Vault Management</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>War Room Collaboration</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Admin Panel</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Role-based Access Control</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span>Real-time Notifications</span>
              </div>
            </div>
          </div>

          {/* License & Copyright */}
          <div className="cyber-panel p-6">
            <h4 className="text-md font-semibold text-cyber-blue mb-3 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              License & Copyright
            </h4>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="font-medium text-cyber-blue">Copyright:</span>
                <span className="ml-2">© 2025 Rudra Forensics & CySecurity Pvt. Ltd. ( RFCSINDIA ) All rights reserved.</span>
              </div>
              <div>
                <span className="font-medium text-cyber-blue">License:</span>
                <span className="ml-2">Proprietary Software</span>
              </div>
              <div className="text-sm text-gray-400 mt-4 p-3 bg-cyber-dark border border-cyber-border rounded">
                This software is the intellectual property of Rudra Forensics & CySecurity Pvt. Ltd. ( RFCSINDIA ). 
                Unauthorized copying, distribution, or modification is strictly prohibited and deals with legal action.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cyber-border bg-cyber-gray">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyber-blue">Settings</h2>
            <p className="text-gray-400">
              Manage your account and application preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <div className="flex items-center space-x-2 text-cyber-green">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Settings saved!</span>
              </div>
            )}
            {unsavedChanges && (
              <button
                onClick={handleSave}
                className="cyber-button flex items-center space-x-2 bg-cyber-green border-cyber-green text-white"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Settings Navigation */}
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

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="cyber-panel"
              >
                {activeTab === "general" && renderGeneralSettings()}
                {activeTab === "subscription" && (
                  <SubscriptionManager user={user} />
                )}
                {activeTab === "security" && renderSecuritySettings()}
                {activeTab === "notifications" && renderNotificationSettings()}
                {activeTab === "privacy" && renderPrivacySettings()}
                {activeTab === "interface" && renderInterfaceSettings()}
                {activeTab === "data" && renderDataSettings()}
                {activeTab === "about" && renderAboutSettings()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
