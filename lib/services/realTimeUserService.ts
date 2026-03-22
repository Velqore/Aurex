// Service for real-time user management
export interface RealTimeUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  specializations: string[];
  role: "admin" | "pro" | "enterprise" | "free";
  joinDate: Date;
  lastActive: Date;
  isOnline: boolean;
}

class RealTimeUserService {
  private static instance: RealTimeUserService;
  private users: RealTimeUser[] = [];
  private listeners: Set<(users: RealTimeUser[]) => void> = new Set();

  static getInstance(): RealTimeUserService {
    if (!this.instance) {
      this.instance = new RealTimeUserService();
    }
    return this.instance;
  }

  // Fetch real users from database API
  async fetchUsers(): Promise<RealTimeUser[]> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.log('🔄 Server-side rendering detected, skipping user fetch');
        return [];
      }

      const token = localStorage.getItem('auth-token');
      if (!token) {
        console.log('🔄 No authentication token found');
        return [];
      }

      console.log('🔄 Fetching users from API with token...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.users) {
        this.users = data.users.map((user: any) => ({
          ...user,
          joinDate: new Date(user.joinDate),
          lastActive: new Date(user.lastActive),
        }));
        this.notifyListeners();
        console.log('📥 Successfully fetched', this.users.length, 'users');
        return this.users;
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      const message = error?.message || String(error);
      if (error?.name === 'AbortError' || /aborted/i.test(message)) {
        console.warn('⚠️ User fetch aborted (timeout)');
        return [];
      }
      console.error('❌ Error fetching real users:', message);
      return [];
    }
  }

  // Subscribe to user updates
  subscribe(callback: (users: RealTimeUser[]) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of user updates
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.users));
  }

  // Get current users
  getUsers(): RealTimeUser[] {
    return this.users;
  }

  // Update user online status
  async updateUserStatus(isOnline: boolean): Promise<void> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.log('🔄 Server-side rendering detected, skipping status update');
        return;
      }

      const token = localStorage.getItem('auth-token');
      if (!token) {
        console.log('🔄 No authentication token found for status update');
        return;
      }

      await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
      });

      // Refresh user list after status update
      await this.fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Start periodic refresh
  startPeriodicRefresh(intervalMs: number = 30000): () => void {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log('🔄 Server-side rendering detected, skipping periodic refresh');
      return () => {}; // Return empty cleanup function
    }

    // Initial fetch
    this.fetchUsers();

    const interval = setInterval(() => {
      this.fetchUsers();
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  // Search users
  searchUsers(query: string): RealTimeUser[] {
    if (!query.trim()) return this.users;

    const searchTerm = query.toLowerCase();
    return this.users.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm) ||
      (user.department || '').toLowerCase().includes(searchTerm)
    );
  }
}

export const realTimeUserService = RealTimeUserService.getInstance();
