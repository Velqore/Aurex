// Terminal session storage schema
export interface TerminalSession {
  id: string;
  userId: string;
  username: string;
  role: string;
  containerId?: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  commandHistory: TerminalCommand[];
  environment: {
    workingDirectory: string;
    environmentVars: Record<string, string>;
    allowedCommands: string[];
    restrictions: string[];
  };
  security: {
    sandboxed: boolean;
    networkIsolated: boolean;
    fileSystemLimited: boolean;
    timeoutMinutes: number;
  };
}

export interface TerminalCommand {
  id: string;
  sessionId: string;
  command: string;
  args: string[];
  output: string;
  error?: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
  blocked?: boolean;
  blockReason?: string;
}

export interface TerminalConfig {
  maxSessions: number;
  sessionTimeout: number; // minutes
  allowedCommands: string[];
  blockedCommands: string[];
  allowedPaths: string[];
  maxOutputSize: number;
  networkAccess: boolean;
}

class TerminalDatabase {
  private sessions: Map<string, TerminalSession> = new Map();
  private commands: Map<string, TerminalCommand[]> = new Map();
  private config: TerminalConfig;

  constructor() {
    this.config = {
      maxSessions: 10,
      sessionTimeout: 30, // 30 minutes
      allowedCommands: [
        // Safe system commands
        'ls', 'pwd', 'whoami', 'id', 'date', 'uptime', 'ps', 'top',
        'cat', 'head', 'tail', 'grep', 'find', 'which', 'file',
        
        // Cybersecurity tools (sandboxed)
        'nmap', 'nslookup', 'dig', 'whois', 'ping', 'traceroute',
        'curl', 'wget', 'nikto', 'sqlmap', 'gobuster',
        'hash', 'base64', 'hexdump', 'strings',
        
        // Safe file operations
        'mkdir', 'touch', 'cp', 'mv', 'chmod', 'chown',
        
        // Package management (restricted)
        'apt', 'pkg', 'pip3', 'npm',
        
        // Text processing
        'awk', 'sed', 'sort', 'uniq', 'wc', 'cut',
        
        // Archive tools
        'tar', 'gzip', 'unzip', 'zip'
      ],
      blockedCommands: [
        // Dangerous system commands
        'rm', 'rmdir', 'dd', 'mkfs', 'fdisk', 'mount', 'umount',
        'sudo', 'su', 'passwd', 'chpasswd', 'useradd', 'userdel',
        'systemctl', 'service', 'kill', 'killall', 'pkill',
        'reboot', 'shutdown', 'halt', 'poweroff',
        
        // Network/security risks
        'ssh', 'scp', 'rsync', 'nc', 'netcat', 'socat',
        'iptables', 'ufw', 'firewall-cmd',
        
        // Compilation/execution
        'gcc', 'g++', 'make', 'cmake', 'python', 'node', 'perl', 'ruby',
        'bash', 'sh', 'zsh', 'fish', 'exec', 'eval',
        
        // Package installation (direct)
        'dpkg', 'rpm', 'yum', 'dnf', 'snap', 'flatpak'
      ],
      allowedPaths: [
        '/home/sandbox',
        '/tmp/user-sandbox',
        '/var/tmp/user-sandbox',
        '/usr/share/wordlists',
        '/usr/share/nmap',
        '/etc/ssl/certs' // For SSL verification
      ],
      maxOutputSize: 1024 * 1024, // 1MB
      networkAccess: true // Controlled network access
    };
  }

  // Create a new terminal session
  async createSession(userId: string, username: string, role: string): Promise<TerminalSession> {
    // Check session limits
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.isActive);
    
    if (userSessions.length >= this.config.maxSessions) {
      throw new Error('Maximum sessions exceeded');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: TerminalSession = {
      id: sessionId,
      userId,
      username,
      role,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      commandHistory: [],
      environment: {
        workingDirectory: '/home/sandbox',
        environmentVars: {
          'HOME': '/home/sandbox',
          'USER': username,
          'TERM': 'xterm-256color',
          'PATH': '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
          'LANG': 'en_US.UTF-8'
        },
        allowedCommands: this.getAllowedCommands(role),
        restrictions: this.getRestrictions(role)
      },
      security: {
        sandboxed: true,
        networkIsolated: role === 'free', // Free users get network isolation
        fileSystemLimited: true,
        timeoutMinutes: role === 'admin' ? 120 : role === 'enterprise' ? 60 : 30
      }
    };

    this.sessions.set(sessionId, session);
    this.commands.set(sessionId, []);

    console.log(`🔐 Created secure terminal session ${sessionId} for user ${username} (${role})`);
    return session;
  }

  // Get session by ID
  getSession(sessionId: string): TerminalSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Update session activity
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // Close session
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      console.log(`🔒 Closed terminal session ${sessionId}`);
    }
  }

  // Add command to history
  addCommand(sessionId: string, command: TerminalCommand): void {
    const commands = this.commands.get(sessionId) || [];
    commands.push(command);
    this.commands.set(sessionId, commands);

    // Keep only last 1000 commands per session
    if (commands.length > 1000) {
      this.commands.set(sessionId, commands.slice(-1000));
    }
  }

  // Get command history
  getCommandHistory(sessionId: string): TerminalCommand[] {
    return this.commands.get(sessionId) || [];
  }

  // Check if command is allowed
  isCommandAllowed(sessionId: string, command: string): { allowed: boolean; reason?: string } {
    const session = this.getSession(sessionId);
    if (!session) {
      return { allowed: false, reason: 'Invalid session' };
    }

    const baseCommand = command.split(' ')[0];

    // Check blocked commands first
    if (this.config.blockedCommands.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is blocked for security reasons` };
    }

    // Check allowed commands
    if (!session.environment.allowedCommands.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is not in allowed list` };
    }

    // Additional role-based restrictions
    if (session.role === 'free' && this.isPremiumCommand(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' requires premium subscription` };
    }

    return { allowed: true };
  }

  // Get allowed commands based on role
  private getAllowedCommands(role: string): string[] {
    const baseCommands = [...this.config.allowedCommands];
    
    if (role === 'admin') {
      // Admins get additional system commands
      baseCommands.push('netstat', 'ss', 'lsof', 'iotop', 'htop', 'strace', 'tcpdump');
    }
    
    if (role === 'enterprise' || role === 'admin') {
      // Enterprise users get advanced security tools
      baseCommands.push('burpsuite', 'zaproxy', 'masscan', 'zmap', 'fierce', 'dnsenum');
    }

    return baseCommands;
  }

  // Get restrictions based on role
  private getRestrictions(role: string): string[] {
    const restrictions = [
      'No root access',
      'Sandboxed file system',
      'Limited network access',
      'Command execution monitoring'
    ];

    if (role === 'free') {
      restrictions.push('Limited to basic tools');
      restrictions.push('No premium security tools');
      restrictions.push('Network isolation enabled');
    }

    return restrictions;
  }

  // Check if command requires premium
  private isPremiumCommand(command: string): boolean {
    const premiumCommands = [
      'burpsuite', 'zaproxy', 'masscan', 'zmap', 'fierce', 'dnsenum',
      'sqlmap', 'nikto', 'gobuster', 'dirb', 'wfuzz', 'ffuf'
    ];
    return premiumCommands.includes(command);
  }

  // Clean up expired sessions
  cleanupSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      const timeoutMs = session.security.timeoutMinutes * 60 * 1000;
      
      if (timeSinceActivity > timeoutMs) {
        this.closeSession(sessionId);
        this.sessions.delete(sessionId);
        this.commands.delete(sessionId);
        console.log(`🧹 Cleaned up expired session ${sessionId}`);
      }
    }
  }

  // Get session statistics
  getSessionStats() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
    const totalCommands = Array.from(this.commands.values())
      .reduce((total, commands) => total + commands.length, 0);

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalCommands,
      sessionsbyRole: {
        admin: activeSessions.filter(s => s.role === 'admin').length,
        enterprise: activeSessions.filter(s => s.role === 'enterprise').length,
        pro: activeSessions.filter(s => s.role === 'pro').length,
        free: activeSessions.filter(s => s.role === 'free').length
      }
    };
  }
}

// Create singleton instance
export const terminalDatabase = new TerminalDatabase();

// Auto cleanup every 5 minutes
setInterval(() => {
  terminalDatabase.cleanupSessions();
}, 5 * 60 * 1000);
