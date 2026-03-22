import { User } from "../types/user";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "free" | "pro" | "enterprise";
}

export interface OtpRequest {
  identifier: string;
  type: "login" | "register" | "password_reset";
}

export interface VerifyOtpRequest {
  identifier: string;
  otpCode: string;
  type: "login" | "register" | "password_reset";
}

class ApiService {
  private baseUrl = "/api";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      // Add auth token to headers if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const headers: any = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "An error occurred",
          error: data.error,
          data: data.requiresOtp ? ({ requiresOtp: true } as T) : undefined,
        };
      }

      return {
        success: true,
        message: data.message,
        data,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Authentication endpoints
  async login(
    credentials: LoginRequest,
  ): Promise<
    ApiResponse<{ user: User; token: string; requiresOtp?: boolean }>
  > {
    const response = await this.request<{ user: User; token: string; requiresOtp?: boolean }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
    );

    // Save token to localStorage if present
    if (response.success && response.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth-token', response.data.token);
      console.log('✅ Auth token saved to localStorage');
    }

    return response;
  }

  async register(
    userData: RegisterRequest,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // Save token to localStorage if present
    if (response.success && response.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth-token', response.data.token);
      console.log('✅ Auth token saved to localStorage');
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request("/auth/logout", {
      method: "POST",
    });

    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      console.log('✅ Auth token cleared from localStorage');
    }

    return response;
  }

  async sendOtp(
    request: OtpRequest,
  ): Promise<ApiResponse<{ otpSent: boolean; expiresIn: number }>> {
    return this.request<{ otpSent: boolean; expiresIn: number }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<
    ApiResponse<{
      user?: User;
      token?: string;
      emailVerified?: boolean;
      resetToken?: string;
    }>
  > {
    const response = await this.request<{
      user?: User;
      token?: string;
      emailVerified?: boolean;
      resetToken?: string;
    }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(request),
    });

    // Save token to localStorage if present
    if (response.success && response.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth-token', response.data.token);
      console.log('✅ Auth token saved to localStorage');
    }

    return response;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>("/users/profile");
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async updatePreferences(preferences: any): Promise<ApiResponse> {
    return this.request("/users/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }

  // Chat endpoints
  async getChatRooms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/chat/rooms");
  }

  async getChatMessages(roomId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/chat/rooms/${roomId}/messages`);
  }

  async sendChatMessage(roomId: string, message: any): Promise<ApiResponse> {
    return this.request(`/chat/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  }

  // File endpoints
  async uploadFile(
    file: File,
    metadata?: any,
  ): Promise<ApiResponse<{ fileId: string; url: string }>> {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    return this.request<{ fileId: string; url: string }>("/files/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  async downloadFile(fileId: string): Promise<ApiResponse<{ url: string }>> {
    return this.request<{ url: string }>(`/files/${fileId}/download`);
  }

  async scanFile(fileId: string): Promise<ApiResponse<{ scanResult: any }>> {
    return this.request<{ scanResult: any }>(`/files/${fileId}/scan`, {
      method: "POST",
    });
  }

  // Threat intelligence endpoints
  async getThreatFeed(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/threats/feed");
  }

  async submitThreatReport(report: any): Promise<ApiResponse> {
    return this.request("/threats/report", {
      method: "POST",
      body: JSON.stringify(report),
    });
  }

  async getIOCs(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/threats/iocs");
  }

  // Admin endpoints
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>("/admin/users");
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.request<any>("/admin/stats");
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Utility function to handle API responses
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  onSuccess?: (data: T) => void,
  onError?: (message: string) => void,
): boolean {
  if (response.success && response.data) {
    onSuccess?.(response.data);
    return true;
  } else {
    onError?.(response.message || "An error occurred");
    return false;
  }
}
