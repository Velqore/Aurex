import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { terminalDatabase } from '@/lib/database/terminalDatabase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Close terminal session
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const session = terminalDatabase.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    terminalDatabase.closeSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session closed successfully'
    });

  } catch (error: any) {
    console.error('❌ Failed to close terminal session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to close session' 
    }, { status: 500 });
  }
}

// Get session details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const session = terminalDatabase.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const commandHistory = terminalDatabase.getCommandHistory(sessionId);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        isActive: session.isActive,
        environment: session.environment,
        security: session.security
      },
      commandHistory: commandHistory.slice(-50) // Last 50 commands
    });

  } catch (error: any) {
    console.error('❌ Failed to get terminal session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get session' 
    }, { status: 500 });
  }
}
