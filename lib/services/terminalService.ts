import { WebSocketServer as WSServer } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { terminalDatabase, TerminalCommand } from '../database/terminalDatabase';

export interface TerminalWebSocketData {
  sessionId: string;
  userId: string;
  username: string;
  role: string;
}

export class SecureTerminalService {
  private static instance: SecureTerminalService;
  private wsServer!: WSServer; // Definite assignment assertion
  private sessions: Map<string, {
    ws: any;
    sessionData: TerminalWebSocketData;
    ptyProcess?: ChildProcess;
    isActive: boolean;
  }> = new Map();

  constructor(port: number = 8081) {
    try {
      this.wsServer = new WSServer({ port });
      this.setupWebSocketServer();
      console.log(`🔒 Secure Terminal WebSocket server running on port ${port}`);
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} already in use, WebSocket server already running`);
        return; // Don't throw error, just return - server is already running
      }
      throw error;
    }
  }

  static getInstance(port?: number): SecureTerminalService {
    if (!SecureTerminalService.instance) {
      SecureTerminalService.instance = new SecureTerminalService(port);
    }
    return SecureTerminalService.instance;
  }

  private setupWebSocketServer() {
    this.wsServer.on('connection', (ws: any, request: any) => {
      console.log('🔌 New WebSocket connection');

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.handleDisconnection(ws);
      });

      ws.on('error', (error: any) => {
        console.error('❌ WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });
  }

  private async handleMessage(ws: any, data: any) {
    switch (data.type) {
      case 'init':
        await this.initializeSession(ws, data);
        break;
      case 'command':
        await this.executeCommand(ws, data);
        break;
      case 'resize':
        await this.resizeTerminal(ws, data);
        break;
      case 'close':
        await this.closeSession(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private async initializeSession(ws: any, data: any) {
    try {
      const { sessionId, userId, username, role, token } = data;

      // Validate session exists in database
      const session = terminalDatabase.getSession(sessionId);
      if (!session || !session.isActive) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid or expired session'
        }));
        return;
      }

      // Store session data
      this.sessions.set(sessionId, {
        ws,
        sessionData: { sessionId, userId, username, role },
        isActive: true
      });

      // Update session activity
      terminalDatabase.updateActivity(sessionId);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'output',
        data: this.getWelcomeMessage(username, role)
      }));

      // Send prompt
      ws.send(JSON.stringify({
        type: 'output',
        data: this.getPrompt(session.environment.workingDirectory, username)
      }));

      console.log(`🔐 Initialized secure terminal session ${sessionId} for ${username}`);

    } catch (error) {
      console.error('❌ Error initializing session:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to initialize session'
      }));
    }
  }

  private async executeCommand(ws: any, data: any) {
    try {
      const { sessionId, command } = data;
      const sessionInfo = this.sessions.get(sessionId);

      if (!sessionInfo) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Session not found'
        }));
        return;
      }

      const session = terminalDatabase.getSession(sessionId);
      if (!session) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid session'
        }));
        return;
      }

      // Update session activity
      terminalDatabase.updateActivity(sessionId);

      // Check if command is allowed
      const commandCheck = terminalDatabase.isCommandAllowed(sessionId, command);
      if (!commandCheck.allowed) {
        const errorMsg = `❌ Command blocked: ${commandCheck.reason}`;
        ws.send(JSON.stringify({
          type: 'output',
          data: `\r\n${errorMsg}\r\n`
        }));
        
        // Log blocked command
        const blockedCommand: TerminalCommand = {
          id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          command,
          args: command.split(' ').slice(1),
          output: errorMsg,
          error: commandCheck.reason,
          exitCode: 1,
          timestamp: new Date(),
          duration: 0,
          blocked: true,
          blockReason: commandCheck.reason
        };
        
        terminalDatabase.addCommand(sessionId, blockedCommand);
        
        ws.send(JSON.stringify({
          type: 'output',
          data: this.getPrompt(session.environment.workingDirectory, sessionInfo.sessionData.username)
        }));
        return;
      }

      // Execute command safely
      await this.executeSafeCommand(ws, sessionId, command, session, sessionInfo);

    } catch (error) {
      console.error('❌ Error executing command:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Command execution failed'
      }));
    }
  }

  private async executeSafeCommand(ws: any, sessionId: string, command: string, session: any, sessionInfo: any) {
    const startTime = Date.now();
    const args = command.split(' ');
    const baseCommand = args[0];
    const commandArgs = args.slice(1);

    // Create sandbox environment
    const sandboxPath = '/tmp/user-sandbox';
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
    }

    // Simulate command execution (safe simulation)
    let output = '';
    let exitCode = 0;
    let error = '';

    try {
      // Handle built-in commands
      switch (baseCommand) {
        case 'pwd':
          output = session.environment.workingDirectory + '\r\n';
          break;
        case 'whoami':
          output = sessionInfo.sessionData.username + '\r\n';
          break;
        case 'id':
          output = `uid=1000(${sessionInfo.sessionData.username}) gid=1000(sandbox) groups=1000(sandbox)\r\n`;
          break;
        case 'ls':
          output = await this.simulateLS(commandArgs, session.environment.workingDirectory);
          break;
        case 'cat':
          output = await this.simulateCAT(commandArgs);
          break;
        case 'date':
          output = new Date().toString() + '\r\n';
          break;
        case 'uptime':
          output = 'up 1 day, 2:34, 1 user, load average: 0.15, 0.25, 0.30\r\n';
          break;
        case 'ps':
          output = this.simulatePS();
          break;
        case 'nmap':
          output = await this.simulateSecurityTool('nmap', commandArgs, sessionInfo.sessionData.role);
          break;
        case 'ping':
          output = await this.simulatePing(commandArgs);
          break;
        case 'curl':
          output = await this.simulateCurl(commandArgs, sessionInfo.sessionData.role);
          break;
        case 'help':
        case '--help':
          output = this.getHelpMessage(sessionInfo.sessionData.role);
          break;
        default:
          output = `aurex: command not found: ${baseCommand}\r\n`;
          exitCode = 127;
      }
    } catch (err: any) {
      error = err.message;
      exitCode = 1;
      output = `Error: ${error}\r\n`;
    }

    const duration = Date.now() - startTime;

    // Store command in history
    const terminalCommand: TerminalCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      command,
      args: commandArgs,
      output,
      error,
      exitCode,
      timestamp: new Date(),
      duration
    };

    terminalDatabase.addCommand(sessionId, terminalCommand);

    // Send output to client
    ws.send(JSON.stringify({
      type: 'output',
      data: output
    }));

    // Send new prompt
    ws.send(JSON.stringify({
      type: 'output',
      data: this.getPrompt(session.environment.workingDirectory, sessionInfo.sessionData.username)
    }));
  }

  private async simulateLS(args: string[], workingDir: string): Promise<string> {
    // Simulate basic file listing
    const files = [
      'drwxr-xr-x  2 sandbox sandbox  4096 Jan 29 12:00 .',
      'drwxr-xr-x  3 sandbox sandbox  4096 Jan 29 11:30 ..',
      '-rw-r--r--  1 sandbox sandbox   220 Jan 29 11:30 .bashrc',
      '-rw-r--r--  1 sandbox sandbox   807 Jan 29 11:30 .profile',
      'drwxr-xr-x  2 sandbox sandbox  4096 Jan 29 12:00 tools',
      '-rw-r--r--  1 sandbox sandbox  1024 Jan 29 12:00 sample.txt'
    ];

    if (args.includes('-la') || args.includes('-al')) {
      return files.join('\r\n') + '\r\n';
    } else if (args.includes('-l')) {
      return files.slice(2).join('\r\n') + '\r\n';
    } else {
      return '.bashrc .profile tools sample.txt\r\n';
    }
  }

  private async simulateCAT(args: string[]): Promise<string> {
    const filename = args[0];
    if (!filename) {
      return 'cat: missing operand\r\n';
    }

    switch (filename) {
      case 'sample.txt':
        return 'This is a sample file in the AUREX secure terminal.\r\nYou can practice cybersecurity commands safely here.\r\n';
      case '.bashrc':
        return '# ~/.bashrc: executed by bash(1) for non-login shells.\r\n# AUREX Secure Terminal Environment\r\nexport PS1="\\u@aurex:\\w$ "\r\n';
      default:
        return `cat: ${filename}: No such file or directory\r\n`;
    }
  }

  private simulatePS(): string {
    return [
      '  PID TTY          TIME CMD',
      '  123 pts/0    00:00:00 bash',
      '  456 pts/0    00:00:00 ps'
    ].join('\r\n') + '\r\n';
  }

  private async simulateSecurityTool(tool: string, args: string[], role: string): Promise<string> {
    if (role === 'free' && ['sqlmap', 'nikto', 'gobuster'].includes(tool)) {
      return `❌ ${tool}: Premium feature - upgrade your subscription to use advanced security tools\r\n`;
    }

    switch (tool) {
      case 'nmap':
        const target = args.find(arg => !arg.startsWith('-')) || '127.0.0.1';
        return [
          `Starting Nmap scan on ${target}`,
          '22/tcp   open  ssh',
          '80/tcp   open  http',
          '443/tcp  open  https',
          'Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds'
        ].join('\r\n') + '\r\n';
      default:
        return `${tool}: simulation mode - no actual scan performed\r\n`;
    }
  }

  private async simulatePing(args: string[]): Promise<string> {
    const target = args.find(arg => !arg.startsWith('-')) || 'google.com';
    return [
      `PING ${target} (8.8.8.8) 56(84) bytes of data.`,
      `64 bytes from ${target}: icmp_seq=1 ttl=56 time=12.4 ms`,
      `64 bytes from ${target}: icmp_seq=2 ttl=56 time=11.8 ms`,
      `64 bytes from ${target}: icmp_seq=3 ttl=56 time=13.1 ms`,
      '',
      `--- ${target} ping statistics ---`,
      '3 packets transmitted, 3 received, 0% packet loss',
      'rtt min/avg/max/mdev = 11.8/12.4/13.1/0.5 ms'
    ].join('\r\n') + '\r\n';
  }

  private async simulateCurl(args: string[], role: string): Promise<string> {
    const url = args.find(arg => !arg.startsWith('-')) || 'http://example.com';
    
    if (role === 'free') {
      return `❌ curl: Network access restricted for free accounts\r\n`;
    }

    return [
      `<!DOCTYPE html>`,
      `<html><head><title>AUREX Secure Curl Simulation</title></head>`,
      `<body><h1>Simulated HTTP Response</h1>`,
      `<p>Target: ${url}</p>`,
      `<p>This is a simulated response for security.</p></body></html>`
    ].join('\r\n') + '\r\n';
  }

  private getWelcomeMessage(username: string, role: string): string {
    return [
      `\r\n🔒 Welcome to AUREX Secure Terminal`,
      `User: ${username} (${role})`,
      `⚠️  Sandboxed Environment - No System Access`,
      `Type 'help' for available commands\r\n`
    ].join('\r\n');
  }

  private getHelpMessage(role: string): string {
    const basicCommands = [
      'Available Commands:',
      '  ls, cat, pwd, whoami, id, date, uptime, ps',
      '  ping, nmap (basic scan)',
      '  help - show this help message',
      ''
    ];

    const premiumCommands = [
      'Premium Commands (Enterprise/Pro):',
      '  curl, wget - network tools',
      '  sqlmap, nikto, gobuster - advanced security tools',
      ''
    ];

    const restrictions = [
      'Security Restrictions:',
      '  ❌ No file system modification',
      '  ❌ No network attacks',
      '  ❌ No system administration',
      '  ❌ All commands are simulated for safety',
      ''
    ];

    let help = basicCommands.join('\r\n');
    if (role !== 'free') {
      help += premiumCommands.join('\r\n');
    }
    help += restrictions.join('\r\n');

    return help;
  }

  private getPrompt(workingDir: string, username: string): string {
    return `${username}@aurex:${workingDir}$ `;
  }

  private async resizeTerminal(ws: any, data: any) {
    // Terminal resize handling (not needed for simulation)
    console.log(`📏 Terminal resize: ${data.cols}x${data.rows}`);
  }

  private async closeSession(ws: any, data: any) {
    const { sessionId } = data;
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      terminalDatabase.closeSession(sessionId);
      console.log(`🔒 Closed terminal session ${sessionId}`);
    }
  }

  private handleDisconnection(ws: any) {
    // Find and clean up the session
    for (const [sessionId, sessionInfo] of this.sessions.entries()) {
      if (sessionInfo.ws === ws) {
        sessionInfo.isActive = false;
        terminalDatabase.closeSession(sessionId);
        this.sessions.delete(sessionId);
        console.log(`🔌 Cleaned up disconnected session ${sessionId}`);
        break;
      }
    }
  }
}

// Export singleton instance
export const secureTerminalService = SecureTerminalService.getInstance();
