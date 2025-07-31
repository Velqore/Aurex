import { NextRequest, NextResponse } from 'next/server';

let terminalServiceInitialized = false;

// Initialize WebSocket server for terminal connections
export async function GET(request: NextRequest) {
  try {
    // Only initialize once
    if (!terminalServiceInitialized) {
      const { secureTerminalService } = await import('@/lib/services/terminalService');
      terminalServiceInitialized = true;
    }
    
    return NextResponse.json({
      success: true,
      websocketUrl: 'ws://localhost:8081',
      message: 'Secure Terminal WebSocket server is running',
      instructions: {
        connect: 'Connect to ws://localhost:8081',
        initialize: 'Send { type: "init", sessionId: "...", userId: "...", username: "...", role: "..." }',
        command: 'Send { type: "command", sessionId: "...", command: "..." }',
        resize: 'Send { type: "resize", sessionId: "...", cols: 80, rows: 24 }',
        close: 'Send { type: "close", sessionId: "..." }'
      }
    });

  } catch (error: any) {
    console.error('❌ WebSocket server error:', error);
    return NextResponse.json({ 
      error: error.message || 'WebSocket server error' 
    }, { status: 500 });
  }
}
