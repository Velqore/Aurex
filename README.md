# AUREX - Advanced Cybersecurity Platform

![AUREX Logo](https://img.shields.io/badge/AUREX-Cybersecurity%20Platform-purple?style=for-the-badge)

AUREX is a cutting-edge cybersecurity platform that provides secure terminal access, threat intelligence, and advanced security tools in a modern web interface.

## 🚀 Features

### 🔒 Secure Terminal
- **Real Linux Command Execution** - Full terminal with actual system commands
- **Sandboxed Environment** - Isolated user spaces for security
- **Package Management** - Install packages with apt, pip, npm in sandbox
- **Session Management** - Persistent terminal sessions
- **Real-time Communication** - WebSocket-based terminal interface

### 🛡️ Security Features
- **Command Filtering** - Dangerous commands are blocked
- **User Isolation** - Each user gets their own sandbox
- **Session Security** - Secure authentication and session management
- **File System Restrictions** - Limited to user sandbox directories

### 💻 Modern UI
- **XTerm.js Integration** - Professional terminal interface
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Cybersecurity-focused design
- **Real-time Status** - Connection and system status indicators

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Terminal**: XTerm.js with WebSocket backend
- **Backend**: Node.js, WebSocket server
- **Authentication**: JWT-based auth system
- **Database**: Drizzle ORM with SQLite
- **UI Components**: Framer Motion, Lucide Icons

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Linux/Unix environment (for terminal features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Aurex.git
   cd Aurex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the terminal server**
   ```bash
   npm run terminal-server
   ```

6. **Access the application**
   - Frontend: http://localhost:3002
   - Terminal Test: http://localhost:3002/terminal-test-standalone

## 🚀 Usage

### Terminal Access
1. Navigate to the terminal section
2. Click "Connect to Terminal" 
3. Start typing commands like `ls`, `pwd`, `whoami`
4. Install packages: `apt update`, `pip3 install package-name`
5. Create files and directories within your sandbox

### Available Commands
- **Navigation**: `cd`, `pwd`, `ls`, `find`
- **File Operations**: `cat`, `touch`, `mkdir`, `nano`
- **System**: `ps`, `top`, `df`, `free`, `uname`
- **Network**: `ping`, `curl`, `wget`, `nslookup`
- **Package Management**: `apt`, `pip3`, `npm` (sandboxed)
- **Development**: `git`, `node`, `python3`

### Security Tools
- `nmap` - Network scanning
- `nikto` - Web vulnerability scanner
- Network utilities and more

## 📁 Project Structure

```
AUREX/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── terminal/      # Terminal session APIs
│   ├── components/        # React components
│   │   ├── SecureTerminal.tsx
│   │   ├── XTermComponent.tsx
│   │   └── XTermWrapper.tsx
│   └── terminal-test/     # Terminal test pages
├── lib/                   # Shared libraries
│   ├── database/         # Database schemas and connections
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── scripts/              # Server scripts
│   ├── terminal-server.js
│   └── enhanced-terminal-server.js
├── sandbox/              # User sandbox directories
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="file:./aurex.db"

# JWT Secret
JWT_SECRET="your-secret-key"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Terminal Server
TERMINAL_PORT=8082
```

### Terminal Server Configuration

The terminal server can be configured in `scripts/enhanced-terminal-server.js`:

- **Port**: Default 8082
- **Sandbox Directory**: `./sandbox/`
- **Blocked Commands**: Security restrictions
- **User Permissions**: Sandbox limitations

## 🛡️ Security

### Sandbox Security
- Each user gets an isolated directory
- Commands are filtered for security
- No root access or system modifications
- File system access limited to user sandbox

### Authentication
- JWT-based session management
- Secure password hashing
- Session timeout and validation

### Network Security
- WebSocket security measures
- CORS protection
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Starting Production Server
```bash
npm start
```

### Terminal Server Development
```bash
# Start enhanced terminal server
node scripts/enhanced-terminal-server.js

# Test WebSocket connection
node scripts/test-websocket.js
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [XTerm.js](https://xtermjs.org/) - Terminal interface
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the terminal test page for examples

---

**⚡ Built with security and performance in mind**
