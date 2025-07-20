import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserPreferences, UserStatistics } from "../types/user";
import { apiService } from "../services/apiService";
import { otpService } from "../services/otpService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  users: User[];

  // Actions
  login: (credentials: { username: string; password: string }) => Promise<void>;
  loginWithOtp: (identifier: string, otpCode: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  upgradeSubscription: (
    plan: "pro" | "enterprise",
    paymentDetails: any,
  ) => Promise<void>;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  getCurrentUser: () => User | null;
  setError: (error: string | null) => void;
  refreshUserData: () => Promise<void>;
}

// Mock users database
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@cybersecchat.com",
    role: "admin",
    password: "admin123", // Demo password
    firstName: "System",
    lastName: "Administrator",
    department: "IT Security",
    specializations: ["Network Security", "Incident Response", "Forensics"],
    joinDate: new Date("2023-01-01"),
    lastActive: new Date(),
    isOnline: true,
    preferences: {
      theme: "cyber",
      notifications: {
        email: true,
        desktop: true,
        threatAlerts: true,
        chatMessages: true,
        systemUpdates: true,
      },
      privacy: {
        profileVisibility: "team",
        activityTracking: true,
        dataSharing: false,
      },
      security: {
        twoFactorEnabled: true,
        sessionTimeout: 30,
        loginAlerts: true,
      },
      interface: {
        defaultView: "chat",
        compactMode: false,
        showTooltips: true,
        autoRefresh: true,
      },
    },
    statistics: {
      totalLogins: 245,
      threatsAnalyzed: 1532,
      filesProcessed: 892,
      chatMessages: 3421,
      toolsUsed: 156,
      lastLoginLocation: "New York, US",
      sessionDuration: 425,
    },
  },
  {
    id: "2",
    username: "Aurex",
    email: "ayushtyagi2213@gmail.com",
    role: "enterprise",
    password: "Aurex213454", // Specified password
    firstName: "Aurex",
    lastName: "Pro",
    department: "Cybersecurity",
    specializations: [
      "Penetration Testing",
      "Malware Analysis",
      "Digital Forensics",
    ],
    joinDate: new Date("2024-01-01"),
    lastActive: new Date(),
    isOnline: true,
    subscription: {
      plan: "enterprise",
      status: "active",
      renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      paymentMethod: "**** 1234",
    },
    preferences: {
      theme: "cyber",
      notifications: {
        email: true,
        desktop: true,
        threatAlerts: true,
        chatMessages: true,
        systemUpdates: true,
      },
      privacy: {
        profileVisibility: "team",
        activityTracking: true,
        dataSharing: false,
      },
      security: {
        twoFactorEnabled: true,
        sessionTimeout: 60,
        loginAlerts: true,
      },
      interface: {
        defaultView: "tools",
        compactMode: false,
        showTooltips: true,
        autoRefresh: true,
      },
    },
    statistics: {
      totalLogins: 89,
      threatsAnalyzed: 342,
      filesProcessed: 156,
      chatMessages: 678,
      toolsUsed: 89,
      lastLoginLocation: "San Francisco, US",
      sessionDuration: 320,
    },
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      users: mockUsers,

            login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.login({
            identifier: credentials.username,
            password: credentials.password,
          });

          if (response.success && response.data && response.data.user) {
            const user = response.data.user;

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Update user in users list
            get().addUser(user);
          } else {
            set({
              error: response.message || "Login failed",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
        }
      },

            loginWithOtp: async (identifier, otpCode) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.verifyOtp({
            identifier,
            otpCode,
            type: "login",
          });

          if (response.success && response.data?.user) {
            const user = response.data.user;

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Update user in users list
            get().addUser(user);
          } else {
            set({
              error: response.message || "OTP verification failed",
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "OTP login failed",
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error("Logout API call failed:", error);
        } finally {
          const currentUser = get().user;
          if (currentUser) {
            get().setOnlineStatus(currentUser.id, false);
          }
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          // Check if username exists
          const existingUser = get().users.find(
            (u) => u.username === userData.username,
          );
          if (existingUser) {
            throw new Error("Username already exists");
          }

          // Create new user
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            username: userData.username!,
            email: userData.email!,
            role: userData.role || "free",
            firstName: userData.firstName,
            lastName: userData.lastName,
            department: userData.department,
            specializations: userData.specializations || [],
            joinDate: new Date(),
            lastActive: new Date(),
            isOnline: true,
            preferences: {
              theme: "cyber",
              notifications: {
                email: true,
                desktop: true,
                threatAlerts: true,
                chatMessages: true,
                systemUpdates: false,
              },
              privacy: {
                profileVisibility: "team",
                activityTracking: true,
                dataSharing: false,
              },
              security: {
                twoFactorEnabled: false,
                sessionTimeout: 30,
                loginAlerts: true,
              },
              interface: {
                defaultView: "chat",
                compactMode: false,
                showTooltips: true,
                autoRefresh: true,
              },
            },
            statistics: {
              totalLogins: 1,
              threatsAnalyzed: 0,
              filesProcessed: 0,
              chatMessages: 0,
              toolsUsed: 0,
              sessionDuration: 0,
            },
          };

          // Add to users list
          get().addUser(newUser);

          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          });
        }
      },

      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
        get().addUser(updatedUser);
      },

      updatePreferences: async (preferences) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = {
          ...currentUser,
          preferences: { ...currentUser.preferences, ...preferences },
        };
        set({ user: updatedUser });
        get().addUser(updatedUser);
      },

      setOnlineStatus: (userId, isOnline) => {
        const users = get().users.map((user) =>
          user.id === userId
            ? { ...user, isOnline, lastActive: new Date() }
            : user,
        );
        set({ users });

        const currentUser = get().user;
        if (currentUser && currentUser.id === userId) {
          set({ user: { ...currentUser, isOnline, lastActive: new Date() } });
        }
      },

      addUser: (user) => {
        const users = get().users.filter((u) => u.id !== user.id);
        set({ users: [...users, user] });
      },

      removeUser: (userId) => {
        const users = get().users.filter((u) => u.id !== userId);
        set({ users });
      },

      upgradeSubscription: async (plan, paymentDetails) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error("No user logged in");

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const roleMap = {
          pro: "pro" as const,
          enterprise: "enterprise" as const,
        };

        const updatedUser = {
          ...currentUser,
          role: roleMap[plan],
          subscription: {
            plan,
            status: "active" as const,
            renewalDate: new Date(
              new Date().setMonth(new Date().getMonth() + 1),
            ),
            paymentMethod: `**** ${paymentDetails.cardNumber?.slice(-4) || "1234"}`,
          },
        };

        set({ user: updatedUser });
        get().addUser(updatedUser);
      },

      getCurrentUser: () => get().user,

      setError: (error) => {
        set({ error });
      },

      refreshUserData: async () => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Simulate refreshing user data
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ user: { ...currentUser, lastActive: new Date() } });
      },
    }),
    {
      name: "auth-storage",
      skipHydration: true,
    },
  ),
);
