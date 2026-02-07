"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import {
  Terminal,
  Play,
  Square,
  RotateCw,
  Settings,
  History,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Monitor,
  Type,
} from "lucide-react";

// Dynamic import for XTerm wrapper to handle SSR
const XTermWrapper = dynamic(() => import('./XTermWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/80 p-4 flex items-center justify-center">
      <div className="text-center">
        <Terminal className="w-8 h-8 text-green-400 mx-auto mb-2 animate-pulse" />
        <p className="text-green-400 text-sm">Loading Terminal Interface...</p>
      </div>
    </div>
  )
});

interface SecureTerminalProps {
  user: any;
}

interface TerminalSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  environment: {
    workingDirectory: string;
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

export default function SecureTerminal({ user }: SecureTerminalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [useAdvancedUI, setUseAdvancedUI] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const useAdvancedUIRef = useRef(useAdvancedUI);
  const currentCommandRef = useRef('');
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure user is available with fallback
  const currentUser = user || {
    id: 'demo-user',
    username: 'demouser',
    email: 'demo@aurex.com',
    role: 'user'
  };

  // Keep refs in sync
  useEffect(() => {
    useAdvancedUIRef.current = useAdvancedUI;
  }, [useAdvancedUI]);

  // Keep command ref in sync
  useEffect(() => {
    currentCommandRef.current = currentCommand;
  }, [currentCommand]);

  // Focus terminal when connected
  useEffect(() => {
    if (isConnected && xtermRef.current) {
      // Small delay to ensure terminal is fully rendered
      setTimeout(() => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }, 500);
    }
  }, [isConnected]);

  // Auto scroll to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput]);

  const addOutput = useCallback((text: string) => {
    setTerminalOutput(prev => [...prev, text]);
  }, []);

  const connectWebSocket = useCallback(async (sessionId: string, token: string) => {
    try {
      console.log('🔌 Attempting to connect to WebSocket at ws://localhost:8082');
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.id || !currentUser.username) {
        throw new Error('User information is not available');
      }
      
      const ws = new WebSocket('ws://localhost:8082');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('connected');
        setIsConnected(true);

        // Initialize session
        const initData = {
          type: 'init',
          sessionId,
          userId: currentUser.id,
          username: currentUser.username,
          role: currentUser.role,
          token
        };
        console.log('📤 Sending init data:', initData);
        ws.send(JSON.stringify(initData));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 Received WebSocket message:', message);
          
          switch (message.type) {
            case 'output':
              // Send to both xterm and fallback - use ref for current state
              if (xtermRef.current && useAdvancedUIRef.current) {
                console.log('🖥️ Writing to XTerm:', JSON.stringify(message.data));
                xtermRef.current.write(message.data);
              } else {
                console.log('📝 XTerm not available, adding to output array');
              }
              addOutput(message.data);
              break;
            case 'error':
              const errorMsg = `❌ Error: ${message.message}`;
              console.error('Terminal error:', message.message);
              if (xtermRef.current && useAdvancedUIRef.current) {
                xtermRef.current.write(`\r\n${errorMsg}\r\n`);
              }
              addOutput(errorMsg);
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
        addOutput(`❌ WebSocket connection failed: ${error}`);
      };

    } catch (error: any) {
      console.error('❌ Failed to connect WebSocket:', error);
      setConnectionStatus('error');
      throw error;
    }
  }, [currentUser, addOutput, useAdvancedUI]);

  const createSession = useCallback(async () => {
    console.log('🚀 Creating terminal session...');
    console.log('Current user in createSession:', currentUser);
    
    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      const token = localStorage.getItem('token') || 'demo-token';
      
      // Check if user is available
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }

      // Initialize WebSocket server if needed
      try {
        await fetch('/api/terminal/websocket');
      } catch (wsError) {
        console.warn('⚠️ WebSocket server may not be running');
      }

      // Create terminal session
      const response = await fetch('/api/terminal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const data = await response.json();
      setSession(data.session);
      sessionIdRef.current = data.session.id;

      // Connect to WebSocket directly here instead of calling connectWebSocket
      try {
        console.log('🔌 Attempting to connect to WebSocket at ws://localhost:8082');
        
        const ws = new WebSocket('ws://localhost:8082');
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setConnectionStatus('connected');
          setIsConnected(true);

          // Initialize session
          const initData = {
            type: 'init',
            sessionId: data.session.id,
            userId: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            token
          };
          console.log('📤 Sending init data:', initData);
          ws.send(JSON.stringify(initData));
          
          // Add a small delay to ensure terminal is ready, then focus
          setTimeout(() => {
            if (xtermRef.current) {
              xtermRef.current.focus();
              console.log('🎯 Terminal focused after connection');
            }
          }, 1000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📥 Received WebSocket message:', message);
            
            switch (message.type) {
              case 'output':
                // Send to both xterm and fallback - use ref for current state
                if (xtermRef.current && useAdvancedUIRef.current) {
                  console.log('🖥️ Writing to XTerm:', JSON.stringify(message.data));
                  xtermRef.current.write(message.data);
                } else {
                  console.log('📝 XTerm not available, adding to output array');
                }
                addOutput(message.data);
                break;
              case 'clear':
                // Clear the terminal
                if (xtermRef.current && useAdvancedUIRef.current) {
                  xtermRef.current.clear();
                }
                setTerminalOutput([]);
                break;
              case 'error':
                const errorMsg = `❌ Error: ${message.message}`;
                console.error('Terminal error:', message.message);
                if (xtermRef.current && useAdvancedUIRef.current) {
                  xtermRef.current.write(`\r\n${errorMsg}\r\n`);
                }
                addOutput(errorMsg);
                break;
              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setConnectionStatus('disconnected');
          setIsConnected(false);
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setConnectionStatus('error');
          setIsConnected(false);
          addOutput(`❌ WebSocket connection failed: ${error}`);
        };

      } catch (wsError: any) {
        console.error('❌ Failed to connect WebSocket:', wsError);
        setConnectionStatus('error');
        throw wsError;
      }

    } catch (error: any) {
      console.error('❌ Failed to create terminal session:', error);
      setConnectionStatus('error');
      addOutput(`❌ Failed to create session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addOutput]);

  // Auto-connect when component mounts
  useEffect(() => {
    console.log('🚀 SecureTerminal mounted, auto-connecting...');
    createSession();
  }, [createSession]);

  const sendCommand = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentCommandRef.current.trim()) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        sessionId: sessionIdRef.current,
        command: currentCommandRef.current.trim()
      }));
      addOutput(`$ ${currentCommandRef.current}`);
      setCurrentCommand('');
    }
  }, [addOutput]);

  // Handle XTerm data input
  const handleXTermData = useCallback((data: string) => {
    console.log('🎮 XTerm input received:', JSON.stringify(data));
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Handle special keys
      if (data === '\r') {
        // Enter key - send current command
        const commandToSend = currentCommandRef.current;
        console.log('📤 Sending command:', commandToSend);
        if (xtermRef.current) {
          xtermRef.current.write('\r\n'); // Move to next line
        }
        wsRef.current.send(JSON.stringify({
          type: 'command',
          sessionId: sessionIdRef.current,
          command: commandToSend.trim()
        }));
        setCurrentCommand('');
      } else if (data === '\x7f') {
        // Backspace - only if there's something to delete
        if (currentCommandRef.current.length > 0) {
          setCurrentCommand(prev => prev.slice(0, -1));
          if (xtermRef.current) {
            xtermRef.current.write('\b \b'); // Move back, write space, move back again
          }
        }
      } else if (data === '\x03') {
        // Ctrl+C
        if (xtermRef.current) {
          xtermRef.current.write('^C\r\n');
        }
        wsRef.current.send(JSON.stringify({
          type: 'interrupt',
          sessionId: sessionIdRef.current
        }));
        setCurrentCommand('');
      } else if (data >= ' ' && data <= '~') {
        // Regular printable character - echo it to terminal and add to command
        console.log('📝 Adding character to command:', data);
        if (xtermRef.current) {
          xtermRef.current.write(data);
        }
        setCurrentCommand(prev => {
          const newCommand = prev + data;
          console.log('💬 Current command:', newCommand);
          return newCommand;
        });
      }
    } else {
      console.warn('⚠️ WebSocket not ready for input');
    }
  }, []);

  // Handle XTerm resize
  const handleXTermResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Debounce resize events to prevent spam
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({
          type: 'resize',
          sessionId: sessionIdRef.current,
          cols,
          rows
        }));
      }, 500);
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendCommand();
    }
  }, [sendCommand]);

  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      if (sessionIdRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'close',
          sessionId: sessionIdRef.current
        }));
      }
      wsRef.current.close();
    }

    setIsConnected(false);
    setSession(null);
    sessionIdRef.current = null;
    setConnectionStatus('disconnected');
    setTerminalOutput([]);
  }, []);

  const restart = useCallback(async () => {
    await disconnect();
    setTimeout(() => {
      createSession();
    }, 1000);
  }, [disconnect, createSession]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-purple-100">Secure Terminal</h2>
            <div className="flex items-center space-x-2 text-sm text-purple-300">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
              {session && (
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                  {currentUser.role.toUpperCase()}
                </span>
              )}
              {/* Debug info */}
              <span className="text-xs text-gray-400">
                | WS: {wsRef.current?.readyState === 1 ? 'Open' : 'Closed'} 
                | XTerm: {xtermRef.current ? 'Ready' : 'Loading'}
                | Output: {terminalOutput.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUseAdvancedUI(!useAdvancedUI)}
            className={`p-2 transition-colors ${
              useAdvancedUI 
                ? 'text-green-300 hover:text-green-100' 
                : 'text-purple-300 hover:text-purple-100'
            }`}
            title={useAdvancedUI ? "Switch to Basic Terminal" : "Switch to Advanced Terminal"}
          >
            {useAdvancedUI ? <Monitor className="w-5 h-5" /> : <Type className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-purple-300 hover:text-purple-100 transition-colors"
            title="Command History"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-purple-300 hover:text-purple-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {!isConnected ? (
            <button
              onClick={createSession}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                         disabled:bg-green-600/50 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isLoading ? 'Connecting...' : 'Connect'}</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              {/* Test button for debugging */}
              <button
                onClick={() => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    console.log('🧪 Sending test command: whoami');
                    wsRef.current.send(JSON.stringify({
                      type: 'command',
                      sessionId: sessionIdRef.current,
                      command: 'whoami'
                    }));
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 
                           text-white rounded-lg transition-colors text-sm"
                title="Send Test Command"
              >
                🧪
              </button>
              <button
                onClick={restart}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 
                           text-white rounded-lg transition-colors"
                title="Restart Session"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={disconnect}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 
                           text-white rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      {session && (
        <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-100 font-semibold">Security Status:</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm">Sandboxed</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">File System Limited</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 ${session.security.networkIsolated ? 'bg-red-400' : 'bg-green-400'} rounded-full`}></div>
                  <span className="text-blue-100">
                    Network {session.security.networkIsolated ? 'Isolated' : 'Allowed'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">No Root Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-100">Session Timeout: {session.security.timeoutMinutes}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Container */}
      <div className="flex-1 relative">
        {isConnected ? (
          <XTermWrapper
            ref={xtermRef}
            onData={handleXTermData}
            onResize={handleXTermResize}
            isConnected={isConnected}
          />
        ) : (
          <div className="w-full h-full bg-black/90 p-4 flex items-center justify-center">
            <div className="text-center">
              <Terminal className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-purple-100 mb-2">
                Terminal Not Connected
              </h3>
              <p className="text-purple-300 mb-4">
                Connect to start a secure terminal session
              </p>
              <button
                onClick={createSession}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50
                           text-white rounded-lg transition-colors"
              >
                {isLoading ? 'Connecting...' : 'Connect to Terminal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-slate-800 border-l border-purple-500/20 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-100">Terminal Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-purple-300 hover:text-purple-100"
              >
                ✕
              </button>
            </div>

            {session && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-purple-200 mb-2">Terminal Mode</h4>
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      onClick={() => setUseAdvancedUI(true)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                        useAdvancedUI 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>Advanced</span>
                    </button>
                    <button
                      onClick={() => setUseAdvancedUI(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                        !useAdvancedUI 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      <span>Basic</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-purple-200 mb-2">Session Info</h4>
                  <div className="space-y-2 text-sm text-purple-300">
                    <div>ID: {session.id.slice(0, 16)}...</div>
                    <div>Started: {new Date(session.startTime).toLocaleTimeString()}</div>
                    <div>Working Dir: {session.environment.workingDirectory}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-purple-200 mb-2">Allowed Commands</h4>
                  <div className="max-h-32 overflow-y-auto text-xs text-purple-300">
                    {session.environment.allowedCommands.map((cmd, idx) => (
                      <div key={idx} className="py-1">{cmd}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-purple-200 mb-2">Restrictions</h4>
                  <div className="space-y-1 text-xs text-purple-300">
                    {session.environment.restrictions.map((restriction, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        <span>{restriction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}