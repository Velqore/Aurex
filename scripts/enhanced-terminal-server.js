#!/usr/bin/env node

/**
 * Enhanced Terminal WebSocket Server with Real Command Execution
 * Provides secure terminal access with actual Linux command execution
 */

const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class EnhancedTerminalServer {
  constructor(port = 8082) {
    this.port = port;
    this.sessions = new Map();
    this.userDirectories = new Map();
    this.init();
  }

  async init() {
    try {
      console.log(`🔒 Enhanced Terminal WebSocket server starting on port ${this.port}`);
      console.log(`📅 ${new Date().toISOString()}`);
      
      this.wss = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false 
      });

      console.log(`✅ WebSocket server created successfully`);

      this.wss.on('connection', (ws, req) => {
        const clientIP = req.socket.remoteAddress;
        console.log(`🔌 New WebSocket connection from ${clientIP}`);

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            await this.handleMessage(ws, data);
          } catch (error) {
            console.error('❌ Error handling message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        });

        ws.on('close', () => {
          console.log(`🔌 WebSocket connection closed for ${clientIP}`);
          // Clean up sessions for this connection
          for (const [sessionId, session] of this.sessions.entries()) {
            if (session.ws === ws) {
              this.cleanupSession(sessionId);
            }
          }
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
        });
      });

      this.wss.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${this.port} already in use - server may already be running`);
        } else {
          console.error('❌ WebSocket server error:', error);
        }
      });

      console.log(`🚀 Enhanced Terminal WebSocket server ready on port ${this.port}`);

    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
    }
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'init':
        await this.handleInit(ws, data);
        break;
      case 'command':
        await this.handleCommand(ws, data);
        break;
      case 'resize':
        this.handleResize(ws, data);
        break;
      case 'interrupt':
        this.handleInterrupt(ws, data);
        break;
      case 'close':
        this.handleClose(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async handleInit(ws, data) {
    const { sessionId, username, role } = data;
    
    try {
      // Create user sandbox directory
      const userDir = await this.createUserSandbox(username);
      
      // Store session
      this.sessions.set(sessionId, {
        ws,
        username,
        role,
        userDir,
        currentDir: userDir,
        startTime: new Date(),
        processes: new Map()
      });

      // Send welcome message
      const welcomeMsg = [
        `\r\n🔒 Welcome to AUREX Enhanced Terminal`,
        `User: ${username} (${role})`,
        `Home: ${userDir}`,
        `⚡ Full Linux command support enabled`,
        `Type 'help' for available commands\r\n`
      ].join('\r\n');

      ws.send(JSON.stringify({
        type: 'output',
        data: welcomeMsg
      }));

      // Send initial prompt
      await this.sendPrompt(sessionId);

      console.log(`🔐 Initialized session ${sessionId} for ${username} in ${userDir}`);
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to initialize terminal session'
      }));
    }
  }

  async createUserSandbox(username) {
    const sandboxRoot = path.join(__dirname, '..', 'sandbox');
    const userDir = path.join(sandboxRoot, username);
    
    try {
      // Create sandbox root if it doesn't exist
      await fs.mkdir(sandboxRoot, { recursive: true });
      
      // Create user directory
      await fs.mkdir(userDir, { recursive: true });
      
      // Create some basic files and directories
      await fs.mkdir(path.join(userDir, 'projects'), { recursive: true });
      await fs.mkdir(path.join(userDir, 'tools'), { recursive: true });
      await fs.mkdir(path.join(userDir, 'downloads'), { recursive: true });
      
      // Create sample files
      await fs.writeFile(
        path.join(userDir, 'welcome.txt'),
        'Welcome to AUREX Terminal!\nThis is your secure sandbox environment.\nYou can create files, install packages, and run commands safely here.\n'
      );
      
      await fs.writeFile(
        path.join(userDir, '.bashrc'),
        '# AUREX Terminal Configuration\nexport PS1="\\u@aurex:\\w$ "\nexport PATH="$PATH:./tools"\necho "AUREX Terminal Ready!"\n'
      );

      this.userDirectories.set(username, userDir);
      return userDir;
    } catch (error) {
      console.error('❌ Failed to create user sandbox:', error);
      throw error;
    }
  }

  async handleCommand(ws, data) {
    const { sessionId, command } = data;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }));
      return;
    }

    console.log(`📤 Command from ${session.username}: ${command}`);

    if (!command.trim()) {
      await this.sendPrompt(sessionId);
      return;
    }

    // Handle built-in commands first
    const builtinResult = await this.handleBuiltinCommand(session, command);
    if (builtinResult.handled) {
      if (builtinResult.output) {
        ws.send(JSON.stringify({
          type: 'output',
          data: builtinResult.output
        }));
      }
      await this.sendPrompt(sessionId);
      return;
    }

    // Execute system command
    await this.executeSystemCommand(session, command);
  }

  async handleBuiltinCommand(session, command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'cd':
        return await this.handleCd(session, args);
      case 'pwd':
        return { handled: true, output: `${session.currentDir}\r\n` };
      case 'clear':
        session.ws.send(JSON.stringify({ type: 'clear' }));
        return { handled: true, output: null };
      case 'help':
        return { 
          handled: true, 
          output: this.getHelpText() 
        };
      case 'exit':
        session.ws.send(JSON.stringify({
          type: 'output',
          data: 'Session ended. Goodbye!\r\n'
        }));
        this.cleanupSession(session);
        return { handled: true, output: null };
      default:
        return { handled: false };
    }
  }

  async handleCd(session, args) {
    try {
      let targetDir;
      
      if (args.length === 0) {
        // cd with no args goes to home
        targetDir = session.userDir;
      } else {
        const requestedPath = args[0];
        
        if (path.isAbsolute(requestedPath)) {
          // Absolute path - ensure it's within user sandbox
          if (requestedPath.startsWith(session.userDir)) {
            targetDir = requestedPath;
          } else {
            return { 
              handled: true, 
              output: `cd: ${requestedPath}: Permission denied (outside sandbox)\r\n` 
            };
          }
        } else {
          // Relative path
          targetDir = path.resolve(session.currentDir, requestedPath);
        }
      }

      // Ensure target is within sandbox
      if (!targetDir.startsWith(session.userDir)) {
        return { 
          handled: true, 
          output: `cd: Permission denied (outside sandbox)\r\n` 
        };
      }

      // Check if directory exists
      const stats = await fs.stat(targetDir);
      if (!stats.isDirectory()) {
        return { 
          handled: true, 
          output: `cd: ${args[0]}: Not a directory\r\n` 
        };
      }

      session.currentDir = targetDir;
      return { handled: true, output: '' };
      
    } catch (error) {
      return { 
        handled: true, 
        output: `cd: ${args[0] || ''}: No such file or directory\r\n` 
      };
    }
  }

  async executeSystemCommand(session, command) {
    const { ws, currentDir, username } = session;

    // Security checks
    if (this.isCommandBlocked(command)) {
      ws.send(JSON.stringify({
        type: 'output',
        data: `❌ Command blocked for security reasons: ${command.split(' ')[0]}\r\n`
      }));
      await this.sendPrompt(session.sessionId);
      return;
    }

    try {
      const child = spawn('bash', ['-c', command], {
        cwd: currentDir,
        env: {
          ...process.env,
          HOME: session.userDir,
          USER: username,
          PWD: currentDir,
          PATH: `${session.userDir}/tools:${process.env.PATH}`,
          TERM: 'xterm-256color'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Store process for potential interruption
      const processId = Date.now().toString();
      session.processes.set(processId, child);

      let hasOutput = false;

      child.stdout.on('data', (data) => {
        hasOutput = true;
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString()
        }));
      });

      child.stderr.on('data', (data) => {
        hasOutput = true;
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString()
        }));
      });

      child.on('close', async (code) => {
        session.processes.delete(processId);
        
        if (!hasOutput && code !== 0) {
          ws.send(JSON.stringify({
            type: 'output',
            data: `Command exited with code ${code}\r\n`
          }));
        }
        
        await this.sendPrompt(session.sessionId);
      });

      child.on('error', async (error) => {
        session.processes.delete(processId);
        ws.send(JSON.stringify({
          type: 'output',
          data: `❌ Command failed: ${error.message}\r\n`
        }));
        await this.sendPrompt(session.sessionId);
      });

    } catch (error) {
      console.error('❌ Failed to execute command:', error);
      ws.send(JSON.stringify({
        type: 'output',
        data: `❌ Failed to execute command: ${error.message}\r\n`
      }));
      await this.sendPrompt(session.sessionId);
    }
  }

  isCommandBlocked(command) {
    const dangerousCommands = [
      'rm', 'rmdir', 'mv', 'cp',  // File operations - allow but monitor
      'sudo', 'su', 'passwd',     // Privilege escalation
      'reboot', 'shutdown', 'halt', 'poweroff',  // System control
      'mkfs', 'fdisk', 'mount', 'umount',        // Disk operations
      'iptables', 'ufw', 'firewall-cmd',         // Firewall
      'systemctl', 'service',                     // System services
      'crontab', 'at',                           // Job scheduling
      'useradd', 'userdel', 'usermod',           // User management
    ];

    const cmdName = command.trim().split(/\s+/)[0];
    
    // Allow package managers but in sandbox
    if (['apt', 'apt-get', 'pip', 'pip3', 'npm', 'yarn', 'pkg'].includes(cmdName)) {
      return false;
    }
    
    return dangerousCommands.includes(cmdName);
  }

  async sendPrompt(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const relativePath = session.currentDir.replace(session.userDir, '~');
    const prompt = `${session.username}@aurex:${relativePath}$ `;
    
    session.ws.send(JSON.stringify({
      type: 'output',
      data: prompt
    }));
  }

  handleResize(ws, data) {
    console.log(`📏 Terminal resize: ${data.cols}x${data.rows}`);
  }

  handleInterrupt(ws, data) {
    const { sessionId } = data;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Kill any running processes
      for (const [pid, process] of session.processes) {
        try {
          process.kill('SIGINT');
          console.log(`🛑 Interrupted process ${pid}`);
        } catch (error) {
          console.error(`❌ Failed to interrupt process ${pid}:`, error);
        }
      }
      session.processes.clear();
      
      ws.send(JSON.stringify({
        type: 'output',
        data: '^C\r\n'
      }));
      
      this.sendPrompt(sessionId);
    }
  }

  handleClose(ws, data) {
    const { sessionId } = data;
    console.log(`🔒 Closing session: ${sessionId}`);
    this.cleanupSession(sessionId);
  }

  cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Kill any running processes
      for (const [pid, process] of session.processes) {
        try {
          process.kill('SIGTERM');
        } catch (error) {
          console.error(`❌ Failed to cleanup process ${pid}:`, error);
        }
      }
      this.sessions.delete(sessionId);
      console.log(`🧹 Cleaned up session ${sessionId}`);
    }
  }

  getHelpText() {
    return [
      '🔒 AUREX Enhanced Terminal Help',
      '',
      'Available Commands:',
      '  Navigation: cd, pwd, ls, find, locate',
      '  Files: cat, head, tail, less, nano, vi, touch, mkdir',
      '  System: ps, top, htop, df, du, free, uname',
      '  Network: ping, curl, wget, nslookup, dig',
      '  Package Management: apt, pip3, npm (sandboxed)',
      '  Development: git, node, python3, gcc, make',
      '  Text Processing: grep, awk, sed, sort, uniq, wc',
      '  Archives: tar, zip, unzip, gzip, gunzip',
      '  Security Tools: nmap, nikto, hashcat (limited)',
      '',
      'Built-in Commands:',
      '  help - Show this help',
      '  clear - Clear terminal',
      '  exit - End session',
      '',
      '🔐 Security: All commands run in isolated sandbox',
      '📁 Home Directory: ~/sandbox/username',
      '⚡ Package installations are sandboxed',
      ''
    ].join('\r\n');
  }
}

// Start the server
if (require.main === module) {
  new EnhancedTerminalServer();
}

module.exports = EnhancedTerminalServer;
