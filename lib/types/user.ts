export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "pro" | "enterprise" | "free";
  avatar?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  specializations: string[];
  joinDate: Date;
  lastActive: Date;
  isOnline: boolean;
  preferences: UserPreferences;
  statistics: UserStatistics;
  password?: string; // For demo purposes - in real app this would be hashed
  subscription?: {
    plan: string;
    status: "active" | "cancelled" | "expired";
    renewalDate: Date;
    paymentMethod?: string;
  };
}

export interface UserPreferences {
  theme: "dark" | "light" | "cyber";
  notifications: {
    email: boolean;
    desktop: boolean;
    threatAlerts: boolean;
    chatMessages: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisibility: "public" | "team" | "private";
    activityTracking: boolean;
    dataSharing: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  interface: {
    defaultView: string;
    compactMode: boolean;
    showTooltips: boolean;
    autoRefresh: boolean;
  };
}

export interface UserStatistics {
  totalLogins: number;
  threatsAnalyzed: number;
  filesProcessed: number;
  chatMessages: number;
  toolsUsed: number;
  lastLoginLocation?: string;
  sessionDuration: number;
}
