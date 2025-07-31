import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { terminalDatabase } from '@/lib/database/terminalDatabase';
import { userDatabase } from '@/lib/database/userDatabase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Create new terminal session
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string, username: string, role: string;

    // Handle demo token for testing
    if (token === 'demo-token') {
      userId = 'demo-user';
      username = 'demouser';
      role = 'admin';
      console.log('🧪 Using demo authentication for terminal session');
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
        const userEmail = decoded.email;
        
        // Get user details
        const user = await userDatabase.findUserByEmail(userEmail);
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        username = user.username;
        role = user.role || 'free';
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Create terminal session
    const session = await terminalDatabase.createSession(userId, username, role);

    console.log(`🔐 Created terminal session for ${username} (${role})`);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        startTime: session.startTime,
        environment: session.environment,
        security: session.security
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to create terminal session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create terminal session' 
    }, { status: 500 });
  }
}

// Get terminal sessions for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    // Handle demo token for testing
    if (token === 'demo-token') {
      userId = 'demo-user';
      console.log('🧪 Using demo authentication for terminal stats');
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Get session statistics
    const stats = terminalDatabase.getSessionStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Failed to get terminal sessions:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get terminal sessions' 
    }, { status: 500 });
  }
}
